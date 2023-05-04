import { SlashCommandBuilder, PermissionFlagsBits,CommandInteraction, TextChannel, hyperlink, userMention, channelMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('send')
        .setNameLocalization('fr', 'envoyer')
        .setDescription('Sends a message in a channel')
        .setDescriptionLocalization('fr', 'Envoie un message dans un salon')
        .addChannelOption(option =>
            option.setName('channel')
                .setNameLocalization('fr', 'salon')
                .setDescription('Channel in which to send the message')
                .setDescriptionLocalization('fr', 'Salon dans lequel envoyer le message')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setDescriptionLocalization('fr', 'Message à envoyer')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['bot-setup']
    ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {TextChannel} */
            const channel = interaction.options.getChannel('channel')
            /** @type {string} */
            const message = interaction.options.getString('message')

            if(channel.type === 'GUILD_CATEGORY')
                throw new CommandInteractionError(Locales.get(interaction.locale, 'invalid_channel_error'))
            
            /** @type {TextChannel} */
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])

            const sentMessage = await channel.send({ content: message })

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle('✍️ Envoi de message')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Par', value: userMention(interaction.user.id), inline: true },
                    { name: 'Salon', value: channelMention(channel.id), inline: true },
                    { name: 'Message', value: `${message} — ${hyperlink('Voir', sentMessage.url)}` }
                )
            
            await logsChannel.send({ embeds: [embed] })

            Logger.log('SendCommand', 'INFO', `Message envoyé par ${interaction.user.tag} dans le channel #${channel.name}`)

            await interaction.reply({ content: Locales.get(interaction.locale, 'message_sent'), ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}