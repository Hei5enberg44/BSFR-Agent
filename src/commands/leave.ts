import { Guild, SlashCommandBuilder, PermissionFlagsBits, VoiceChannel, ChatInputCommandInteraction, userMention, channelMention } from 'discord.js'
import { getVoiceConnection } from '@discordjs/voice'
import { CommandError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setNameLocalization('fr', 'partir')
        .setDescription('Leave from a voice channel')
        .setDescriptionLocalization('fr', 'Partir d\'un salon vocal')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const guild = <Guild>interaction.guild
            const voiceConnection = getVoiceConnection(guild.id)

            if(voiceConnection) {
                const channelId = <string>voiceConnection.joinConfig.channelId

                const channel = <VoiceChannel>guild.channels.cache.get(channelId)

                voiceConnection.destroy()
    
                Logger.log('LeaveCommand', 'INFO', `@${interaction.client.user.username} est parti de 🔊${channel.name}`)

                await interaction.reply({ content: Locales.get(interaction.locale, 'voice_channel_leaved', userMention(config.clientId), channelMention(channel.id)), ephemeral: true })
            } else {
                Logger.log('LeaveCommand', 'INFO', `@${interaction.client.user.username} ne se trouve dans aucun salon vocal`)

                await interaction.reply({ content: Locales.get(interaction.locale, 'voice_channel_leave_error', userMention(interaction.client.user.id)), ephemeral: true })
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR' || error.name === 'QUOTA_LIMIT_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}