import { Readable } from 'node:stream'
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, VoiceChannel, CommandInteraction, userMention, channelMention, inlineCode } from 'discord.js'
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice'
import Embed from '../utils/embed.js'
import { CommandError } from '../utils/error.js'
import { ttsAPI } from '../controllers/google.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('speak')
        .setNameLocalization('fr', 'parler')
        .setDescription('Speak in a vocal channel')
        .setDescriptionLocalization('fr', 'Parler dans un salon vocal')
        .addChannelOption(option =>
            option.setName('channel')
                .setNameLocalization('fr', 'salon')
                .setDescription('Channel in which to send the voice message')
                .setDescriptionLocalization('fr', 'Salon dans lequel envoyer le message vocal')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Voice message to send')
                .setDescriptionLocalization('fr', 'Message vocal à envoyer')
                .setRequired(true)
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
    allowedChannels: [
        config.guild.channels['bot-setup']
    ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {VoiceChannel} */
            const channel = interaction.options.getChannel('channel')
            /** @type {string} */
            const message = interaction.options.getString('message')
            /** @type {string} */
            const voice = interaction.options.getString('voice') ?? 'fr-FR-Wavenet-B'

            /** @type {TextChannel} */
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])

            const voiceConnection = joinVoiceChannel({
                guildId: config.guild.id,
                channelId: channel.id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            })

            const speech = await ttsAPI.synthesize(message, voice)

            const audio = Readable.from(speech)

            const player = createAudioPlayer()
            const resource = createAudioResource(audio, {
                inlineVolume: true
            })

            voiceConnection.subscribe(player)
            player.play(resource)

            player.on(AudioPlayerStatus.Idle, () => {
                voiceConnection.disconnect()
            })

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
                    { name: 'Salon', value: channelMention(channel.id), inline: true },
                    { name: 'Voix', value: voiceChoice, inline: true },
                    { name: 'Message', value: inlineCode(message) }
                )

            await logsChannel.send({ embeds: [embed] })

            Logger.log('SpeakCommand', 'INFO', `Message vocal envoyé par ${interaction.user.tag} dans le salon #${channel.name}`)

            await interaction.reply({ content: Locales.get(interaction.locale, 'vocal_message_sent'), ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}