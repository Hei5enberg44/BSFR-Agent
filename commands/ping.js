const { CommandInteraction } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const Logger = require('../utils/logger')

module.exports = {
    data: {
        name: 'ping',
        description: 'Test si le bot fonctionne',
        default_member_permissions: '0'
    },

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            Logger.log('PingCommand', 'INFO', 'Ping... Pong!')
            await interaction.reply({ content: 'Pong! 🏓', ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}