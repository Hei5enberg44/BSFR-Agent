const { CommandInteraction } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')

module.exports = {
	data: {
		name: 'avatar',
		description: 'Récupère l\'avatar d\'un membre',
        options: [
            {
                type: 'USER',
                name: 'membre',
                description: 'Membre pour lequel récupérer l\'avatar',
                required: false
            }
        ]
    },

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const member = interaction.options.getUser('membre') ?? interaction.user

            const avatarUrl = member.displayAvatarURL({ dynamic: true, size: 1024, format: 'png' })

            await interaction.reply({ content: avatarUrl })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}