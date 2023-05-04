import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, TextChannel, userMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import mute from '../controllers/mute.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmutes a member')
        .setDescriptionLocalization('fr', 'Démute un membre')
        .addUserOption(option =>
            option.setName('member')
                .setNameLocalization('fr', 'membre')
                .setDescription('Member to unmute')
                .setDescriptionLocalization('fr', 'Membre à unmute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setNameLocalization('fr', 'raison')
                .setDescription('Unmute reason')
                .setDescriptionLocalization('fr', 'Raison de l\'unmute')
                .setRequired(true)
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
            const member = interaction.options.getUser('member')
            /** @type {string} */
            const reason = interaction.options.getString('reason')

            const isMuted = await mute.isMuted(member.id)
            if(!isMuted) throw new CommandInteractionError(Locales.get(interaction.locale, 'member_not_muted_error', userMention(member.id)))

            /** @type {TextChannel} */
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles.Muted)

            await mute.remove(member.id)

            const embeds = []

            embeds.push(new Embed()
                .setColor('#2ECC71')
                .setTitle(`🔇 Unmute manuel de ${member.username}`)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Le vilain', value: userMention(member.id), inline: true },
                    { name: 'Prononcé par', value: userMention(isMuted.mutedBy), inline: true },
                    { name: 'Levée par', value: userMention(interaction.user.id), inline: true },
                    { name: 'Raison unmute', value: reason, inline: true },
                    { name: 'Unmute initialement prévu', value: time(isMuted.unmuteDate, TimestampStyles.RelativeTime) },
                ))

            const guildMember = interaction.guild.members.cache.get(member.id)
            await guildMember.roles.remove(muteRole)

            try {
                const unmuteMessage = `🇫🇷 ${Locales.get('fr', 'unmute_message')}`
                    + '\n\n━━━━━━━━━━━━━━━\n\n'
                    + `🇬🇧 ${Locales.get('en-US', 'unmute_message')}`
                await member.send({ content: unmuteMessage })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }

            await logsChannel.send({ embeds: embeds })

            Logger.log('MuteCommand', 'INFO', `Le membre ${member.tag} a été unmute par ${interaction.user.tag}`)

            await interaction.reply({ content: Locales.get(interaction.locale, 'member_unmuted', userMention(member.id)), ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}