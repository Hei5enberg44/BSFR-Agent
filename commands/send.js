const { CommandInteraction, ApplicationCommandOptionType, hyperlink, userMention, channelMention } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    data: {
        name: 'send',
        description: 'Envoie un message dans un channel',
        options: [
            {
                type: ApplicationCommandOptionType.Channel,
                name: 'channel',
                description: 'Channel',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
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
            const channel = interaction.options.getChannel('channel')
            const message = interaction.options.getString('message')

            if(channel.type === 'GUILD_CATEGORY')
                throw new CommandInteractionError('Merci de sélectionner un channel correct')
            
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs)

            const sentMessage = await channel.send(message)

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle('✍️ Envoi de message')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Par', value: userMention(interaction.user.id), inline: true },
                    { name: 'Channel', value: channelMention(channel.id), inline: true },
                    { name: 'Message', value: hyperlink('Lien', sentMessage.url) + ' - ' + message }
                )
            
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