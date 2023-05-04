import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } from 'discord.js'
import { CommandError } from '../utils/error.js'
import Logger from '../utils/logger.js'

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test if the bot is online')
        .setDescriptionLocalization('fr', 'Test si le bot est en ligne')
        .setDMPermission(true)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            Logger.log('PingCommand', 'INFO', 'Ping... Pong!')
            await interaction.reply({ content: 'Pong! 🏓', ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}