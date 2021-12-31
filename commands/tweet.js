const { MessageEmbed, CommandInteraction } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError } = require('../utils/error')
const twitter = require('../controllers/twitter')
const Logger = require('../utils/logger')
const config = require('../config.json')

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
        defaultPermission: false
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

            const embed = new MessageEmbed()
                .setColor('#9B59B6')
                .setTitle('✉️ Confirmation de l\'envoi de tweet')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addField('Par', userMention(interaction.user.id))
                .addField('Tweet', text)
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
            
            const reply = await interaction.reply({ embeds: [embed], fetchReply: true })

            await twitter.add(interaction.user.id, text, interaction.channel.id, reply.id)

            await reply.react('✅')
            await reply.react('❌')

            Logger.log('Twitter', 'INFO', `${interaction.user.tag} a effectué une demande d\'envoi de Tweet`)
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}