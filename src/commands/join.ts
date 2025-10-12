import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChannelType,
    VoiceChannel,
    ChatInputCommandInteraction,
    userMention,
    channelMention
} from 'discord.js'
import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice'
import { CommandError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('join')
        .setNameLocalization('fr', 'rejoindre')
        .setDescription('Join a voice channel')
        .setDescriptionLocalization('fr', 'Rejoindre à salon vocal')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setNameLocalization('fr', 'salon')
                .setDescription('Channel to join')
                .setDescriptionLocalization('fr', 'Salon à rejoindre')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const channel = interaction.options.getChannel(
                'channel',
                true
            ) as VoiceChannel

            const guild = interaction.guild as Guild

            const voiceConnection = joinVoiceChannel({
                guildId: config.guild.id,
                channelId: channel.id,
                adapterCreator: guild.voiceAdapterCreator
            })

            voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
                Logger.log(
                    'JoinCommand',
                    'INFO',
                    `@${interaction.client.user.username} a quitté 🔊${channel.name}`
                )
            })

            Logger.log(
                'JoinCommand',
                'INFO',
                `@${interaction.client.user.username} a rejoint 🔊${channel.name}`
            )

            await interaction.reply({
                content: Locales.get(
                    interaction.locale,
                    'voice_channel_joined',
                    userMention(interaction.client.user.id),
                    channelMention(channel.id)
                ),
                ephemeral: true
            })
        } catch (error) {
            if (
                error.name === 'COMMAND_INTERACTION_ERROR' ||
                error.name === 'QUOTA_LIMIT_ERROR'
            ) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
