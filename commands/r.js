const { CommandError, CommandInteractionError } = require('../utils/error')
const { userMention } = require('@discordjs/builders')
const threads = require('../controllers/threads')
const Logger = require('../utils/logger')
const { CommandInteraction } = require('discord.js')

module.exports = {
	data: {
		name: 'r',
		description: 'Répond à un message privé',
        options: [
            {
                type: 'STRING',
                name: 'message',
                description: 'Message',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const message = interaction.options.getString('message')
            const thread = await threads.get('dm', interaction.channelId, null)

            if(!thread) throw new CommandInteractionError('Merci d\'effectuer cette commande dans un thread de message privé')

            const member = interaction.guild.members.cache.get(thread.memberId)

            if(member) {
                try {
                    await member.send({ content: `${userMention(interaction.user.id)}: ${message}` })
                    Logger.log('RCommand', 'INFO', `Message privé envoyé à ${member.user.tag}`)
                    await interaction.reply({ content: `${userMention(interaction.user.id)}: ${message}`, allowedMentions: { repliedUser: false } })
                } catch(error) {
                    Logger.log('RCommand', 'ERROR', `Le message privé à ${member.user.tag} n'a pas pu être envoyé`)
                    await interaction.reply({ content: `Le message privé à ${userMention(member.id)} n'a pas pu être envoyé` })
                }
            } else {
                Logger.log('RCommand', 'ERROR', `Impossible de récupérer le membre "${thread.memberId}"`)
                await interaction.reply({ content: 'Le membre ne fait plus partie de ce serveur', ephemeral: true })
            }
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}