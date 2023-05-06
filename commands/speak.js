import { Readable } from 'node:stream'
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, VoiceChannel, CommandInteraction, userMention, channelMention, inlineCode } from 'discord.js'
import { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource } from '@discordjs/voice'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, QuotaLimitError } from '../utils/error.js'
import { TextToSpeech } from '../controllers/google.js'
import quotas from '../controllers/quotas.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('speak')
        .setNameLocalization('fr', 'parler')
        .setDescription('Speak in a vocal channel')
        .setDescriptionLocalization('fr', 'Parler dans un salon vocal')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Voice message to send')
                .setDescriptionLocalization('fr', 'Message vocal à envoyer')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setNameLocalization('fr', 'salon')
                .setDescription('Channel in which to send the voice message')
                .setDescriptionLocalization('fr', 'Salon dans lequel envoyer le message vocal')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('voice')
                .setNameLocalization('fr', 'voix')
                .setDescription('Voice to use')
                .setDescriptionLocalization('fr', 'Voix à utiliser')
                .addChoices(
                    { name: 'Male — English (US)', name_localizations: { fr: 'Homme — Anglais (US)' }, value: 'en-US-Wavenet-J' },
                    { name: 'Female — English (US)', name_localizations: { fr: 'Femme — Anglais (US)' }, value: 'en-US-Wavenet-H' },
                    { name: 'Male — French', name_localizations: { fr: 'Homme — Français' }, value: 'fr-FR-Wavenet-B' },
                    { name: 'Female — French', name_localizations: { fr: 'Femme — Français' }, value: 'fr-FR-Wavenet-E' }
                )
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {string} */
            const message = interaction.options.getString('message')
            /** @type {VoiceChannel} */
            const channel = interaction.options.getChannel('channel')
            /** @type {string} */
            const voice = interaction.options.getString('voice') ?? 'fr-FR-Wavenet-B'

            const messageLength = message.length

            // Vérification du quota disponible
            const ttsQuota = await quotas.get('tts')
            if(ttsQuota.current + messageLength > ttsQuota.max) {
                throw new QuotaLimitError(Locales.get(interaction.locale, 'quota_reached'))
            }

            // Mise à jour du quota
            ttsQuota.current += messageLength
            ttsQuota.save()

            const ttsQuotaUsage = Math.round((ttsQuota.current * 100) / ttsQuota.max)

            /** @type {TextChannel} */
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])

            let voiceConnection
            if(!channel) {
                voiceConnection = getVoiceConnection(interaction.guild.id)

                if(!voiceConnection) {
                    Logger.log('SpeakCommand', 'ERROR', `@${interaction.client.user.username} ne se trouve dans aucun salon vocal`)

                    throw new CommandInteractionError(Locales.get(interaction.locale, 'voice_channel_leave_error', `@${interaction.client.user.username}`))
                }
            } else {
                voiceConnection = joinVoiceChannel({
                    guildId: config.guild.id,
                    channelId: channel.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                })
            }

            const speech = await TextToSpeech.synthesize(message, voice)

            const audio = Readable.from(Buffer.from(speech, 'base64'))

            const player = createAudioPlayer()
            const resource = createAudioResource(audio, {
                inlineVolume: true
            })

            voiceConnection.subscribe(player)
            player.play(resource)

            // Récupération du choix de voix utilisé
            const commandOptions = this.data.toJSON().options
            const voiceOption = commandOptions.find(o => o.name === 'voice')
            const voiceOptionSelected = voiceOption.choices.find(c => c.value === voice)
            const voiceChoice = voiceOptionSelected.name_localizations.fr

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle('🎙️ Envoi de message vocal')
                .addFields(
                    { name: 'Par', value: userMention(interaction.user.id), inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Salon', value: channelMention(channel.id), inline: true },
                    { name: 'Voix', value: voiceChoice, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Quota', value: `${ttsQuotaUsage}%`, inline: true },
                    { name: 'Message', value: inlineCode(message) }
                )

            await logsChannel.send({ embeds: [embed] })

            Logger.log('SpeakCommand', 'INFO', `Message vocal envoyé par ${interaction.user.tag} dans le salon 🔊${channel.name}`)

            await interaction.reply({ content: Locales.get(interaction.locale, 'vocal_message_sent'), ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'QUOTA_LIMIT_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}