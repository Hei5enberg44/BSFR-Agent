const { REST } = require("@discordjs/rest")
const { SlashCommandBuilder } = require('@discordjs/builders')
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");

class CommandManager {
    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils;
        this.clients = opt.clients;

        this.opt = opt;

        this.commands = {}
        this.slashCommands = []
    }

    async init(guild) {
        this.opt.guild = guild

        this.utils.logger.log("[CommandManager] Initialisation")

        // For each file in the folder
        fs.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))(this.opt)

            this.utils.logger.log("[CommandManager] Find '" + cmd.name + "'")

            this.commands[cmd.name] = cmd

            let slashCommand = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description)

            if(cmd.options !== undefined) {
                // Setting all the options for the command
                for (const [, cmdOption] of Object.entries(cmd.options)) {
                    switch(cmdOption.type) {
                        case "channel":
                            slashCommand.addChannelOption(option => this.setOption(option, cmdOption))
                            break;
                        case "integer":
                            slashCommand.addIntegerOption(option => this.setOption(option, cmdOption));
                            break;
                        case "string":
                            slashCommand.addStringOption(option => this.setOption(option, cmdOption));
                            break;
                        case "user":
                            slashCommand.addUserOption(option => this.setOption(option, cmdOption))
                            break;
                    }
                }
            }

            this.slashCommands.push(slashCommand.toJSON())
        })

        const rest = new REST({ version: '9' }).setToken(this.config.discord.token)

        try {
            this.utils.logger.log("[CommandManager] Started refreshing application (/) commands.")

            await rest.put(
                Routes.applicationGuildCommands(this.config.discord.clientId, this.config.discord.guildId),
                { body: this.slashCommands },
            );

            this.utils.logger.log("[CommandManager] SUCCESS: Refresh application (/) commands")

            let commands = await guild?.commands.fetch()

            // Update every command that have to be available only by specific roles
            // for(const [, command] of commands.entries()) {
            //     if(this.commands[command.name].roles) {
            //         this.utils.logger.log("[CommandManager] Setting roles for command '" + command.name + "'")
            //         let permissions = []
            //
            //         for(let i in this.commands[command.name].roles) {
            //             permissions = [...permissions, {
            //                 id: guild.roles.cache.find(role => role.name === this.commands[command.name].roles[i]).id,
            //                 type: "ROLE",
            //                 permission: true
            //             }]
            //         }
            //
            //         // Denying every other roles to access the command
            //         permissions = [...permissions, {
            //             id: guild.roles.cache.find(role => role.name === "@everyone").id,
            //             type: "ROLE",
            //             permission: false
            //         }]
            //
            //         await command.permissions.set({ permissions })
            //     }
            // }
        } catch (error) {
            this.utils.logger.log("[CommandManager] ERROR: " + error)
        }

        this.registerEvent()
    }

    registerEvent() {
        this.clients.discord.getClient().on('interactionCreate', async interaction => {
            if (!interaction.isCommand())
                return;

            // If the command exist
            if(this.commands[interaction.commandName]) {
                this.utils.logger.log("[CommandManager] " + interaction.user.tag + " a exécuté la commande '" + interaction.commandName + "'")

                let wrongChannel = false

                // Check if the command has been executed in the correct channel
                for(let channel of this.commands[interaction.commandName].channels) {
                    if(this.config.ids.channels[channel] !== interaction.channelId){
                        wrongChannel = true
                    } else {
                        wrongChannel = false
                        break
                    }
                }

                if(wrongChannel) {
                    this.utils.logger.log("[" + this.commands[interaction.commandName].constructor.name + "] Command executed in the wrong channel")
                    return interaction.reply({content: "Merci d'effectuer cette commande dans un des channels suivants: " + this.commands[interaction.commandName].channels.map((channel) => {return "<#" + this.config.ids.channels[channel] + ">"}).join(" "), ephemeral: true});
                }

                this.commands[interaction.commandName].run(interaction)
            } else {
                await interaction.reply({content: "Commande inexistante", ephemeral: true});
            }
        });
    }

    setOption(option, cmdOption) {
        option.setName(cmdOption.name)
            .setDescription(cmdOption.description)
            .setRequired(cmdOption.required)

        if(cmdOption.choices) {
            for(const [, choice] of cmdOption.choices.entries()) {
                option.addChoice(choice.displayName, choice.name)
            }
        }

        return option
    }
}

module.exports = CommandManager;