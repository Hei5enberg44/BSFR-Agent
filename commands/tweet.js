const { CommandInteraction } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const twitter = require('../controllers/twitter')
const Logger = require('../utils/logger')

module.exports = {
	data: {
		name: 'tweet',
		description: 'Tweete sur le compte @BeatSaberFR',
        options: [
            {
                type: 'STRING',
                name: 'texte',
                description: '280 caractères max.',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin' ],
    channels: [ 'admin' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const text = interaction.options.getString('texte')

            if(text.length > 280) throw new CommandInteractionError('Votre tweet fait plus de 280 caractères !') 

            const embed = new Embed()
                .setColor('#9B59B6')
                .setTitle('✉️ Confirmation de l\'envoi de tweet')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addField('Par', userMention(interaction.user.id))
                .addField('Tweet', text)
            
            const reply = await interaction.reply({ embeds: [embed], fetchReply: true })

            await twitter.add(interaction.user.id, text, interaction.channel.id, reply.id)

            await reply.react('✅')
            await reply.react('❌')

            Logger.log('Twitter', 'INFO', `${interaction.user.tag} a effectué une demande d'envoi de Tweet`)
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}