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

    async init() {
        // On "scan" le dossier des commandes et on ajoute les commandes.
        fs.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))(this.opt)

            this.utils.logger.log("[CommandManager] Find '" + cmd.name + "'")

            this.commands[cmd.name] = cmd

            let slashCommand = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description)

            if(cmd.options !== undefined) {
                for (const [, cmdOption] of Object.entries(cmd.options)) {
                    switch(cmdOption.type) {
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

            let guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
            let commands = await guild?.commands.fetch()

            for(const [, command] of commands.entries()) {
                if(this.commands[command.name].roles) {
                    let permissions = []

                    for(let i in this.commands[command.name].roles) {
                        permissions = [...permissions, {
                            id: guild.roles.cache.find(role => role.name === this.commands[command.name].roles[i]).id,
                            type: "ROLE",
                            permission: true
                        }]
                    }

                    permissions = [...permissions, {
                        id: guild.roles.cache.find(role => role.name === "@everyone").id,
                        type: "ROLE",
                        permission: false
                    }]

                    await command.permissions.set({ permissions })
                }
            }
        } catch (error) {
            this.utils.logger.log("[CommandManager] ERROR: " + error)
        }

        this.registerEvent()
    }

    registerEvent() {
        this.clients.discord.getClient().on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            if(this.commands[interaction.commandName] !== undefined) {
                this.utils.logger.log("[CommandManager] " + interaction.user.username + "#" + interaction.user.discriminator + " a exécuté la commande '" + interaction.commandName + "'")

                this.commands[interaction.commandName].run(interaction)
            } else {
                await interaction.reply({content: "Commande inexistante", ephemeral: true});
            }
        });
    }

    setOption(option, cmdOption) {
        return option.setName(cmdOption.name)
            .setDescription(cmdOption.description)
            .setRequired(cmdOption.required)
    }
}

module.exports = CommandManager;