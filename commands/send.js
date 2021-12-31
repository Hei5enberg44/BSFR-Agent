const { MessageEmbed, CommandInteraction } = require('discord.js')
const { hyperlink, userMention, channelMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError } = require('../utils/error')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'send',
		description: 'Envoie un message dans un channel',
        options: [
            {
                type: 'CHANNEL',
                name: 'channel',
                description: 'Channel',
                required: true
            },
            {
                type: 'STRING',
                name: 'message',
                description: 'Message',
                required: true
            }
        ],
        defaultPermission: false
    },
    roles: [ 'Admin', 'Modérateur' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const channel = interaction.options.getChannel('channel')
            const message = interaction.options.getString('message')

            if(channel.type === 'GUILD_CATEGORY')
                throw new CommandInteractionError('Merci de sélectionner un channel correct')
            
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs.id)

            const sentMessage = await channel.send(message)

            const embed = new MessageEmbed()
                .setColor('#2ECC71')
                .setTitle('✍️ Envoi de message')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addField('Par', userMention(interaction.user.id), true)
                .addField('Channel', channelMention(channel.id), true)
                .addField('Message', hyperlink('Lien', sentMessage.url) + ' - ' + message)
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
            
            await logsChannel.send({ embeds: [embed] })

            Logger.log('SendCommand', 'INFO', `Message envoyé par ${interaction.user.tag} dans le channel #${channel.name}`)

            await interaction.reply({ content: 'Le message a bien été envoyé !', ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}