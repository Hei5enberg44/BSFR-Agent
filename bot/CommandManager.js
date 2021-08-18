const { REST } = require("@discordjs/rest")
const { SlashCommandBuilder } = require('@discordjs/builders')
const { Routes } = require('discord-api-types/v9');
const fs = require("fs");

class CommandManager {
    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils;
        this.clients = opt.clients;

        this.commands = {}
        this.slashCommands = []
    }

    async init() {
        // On "scan" le dossier des commandes et on ajoute les commandes.
        fs.readdirSync("./bot/commands/").forEach(file => {
            let cmd = new (require("./commands/" + file))

            this.utils.logger.log("[CommandManager] Find '" + cmd.name + "'")

            this.commands[cmd.name] = cmd

            let slashCommand = new SlashCommandBuilder()
                .setName(cmd.name)
                .setDescription(cmd.description)

            if(cmd.options !== undefined) {
                for (const [name, cmdOption] of Object.entries(cmd.options)) {
                    switch(cmdOption.type) {
                        case "string":
                            slashCommand.addStringOption(option =>
                                option.setName(name)
                                    .setDescription(cmdOption.description)
                                    .setRequired(cmdOption.required));
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
}

module.exports = CommandManager;