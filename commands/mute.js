import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, GuildMember, TextChannel, inlineCode, userMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import mute from '../controllers/mute.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member over a defined period')
        .setDescriptionLocalization('fr', 'Mute un membre sur une période définie')
        .addUserOption(option =>
            option.setName('member')
                .setNameLocalization('fr', 'membre')
                .setDescription('Member to mute')
                .setDescriptionLocalization('fr', 'Membre à mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setNameLocalization('fr', 'raison')
                .setDescription('Mute reason')
                .setDescriptionLocalization('fr', 'Raison du mute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duration')
                .setNameLocalization('fr', 'durée')
                .setDescription('Mute duration (s = seconds, i = minutes, h = hours, d = days, w = weeks, m = months, y = years)')
                .setDescriptionLocalization('fr', 'Durée du mute (s = secondes, i = minutes, h = heures, d = jours, w = semaines, m = mois, y = années)')
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
            /** @type {GuildMember} */
            const member = interaction.options.getMember('member')
            /** @type {string} */
            const reason = interaction.options.getString('reason')
            /** @type {string} */
            const duration = interaction.options.getString('duration')

            // Si on essaie de mute un Administrateur ou un Modérateur
            if(member.roles.cache.find(r => r.id === config.guild.roles['Admin'] || r.id === config.guild.roles['Modérateur']))
                throw new CommandInteractionError(Locales.get(interaction.locale, 'mute_admin_error'))

            // Si on essaie de mute un bot
            if(member.user.bot) throw new CommandInteractionError(Locales.get(interaction.locale, 'mute_bot_error'))

            const isMuted = await mute.isMuted(member.id)
            if(isMuted) throw new CommandInteractionError(Locales.get(interaction.locale, 'already_muted_error', userMention(member.id)))

            const date = mute.getUnmuteDate(duration)

            if(!date) throw new CommandInteractionError(Locales.get(interaction.locale, 'invalid_duration', duration))

            /** @type {TextChannel} */
            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles['Muted'])

            await mute.add(member.id, interaction.user.id, reason, date)

            const embeds = []

            embeds.push(new Embed()
                .setColor('#2ECC71')
                .setTitle(`🔇 Mute de ${member.user.username}`)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Le vilain', value: userMention(member.id), inline: true },
                    { name: 'Mute réalisé par', value: userMention(interaction.user.id), inline: true },
                    { name: 'Raison', value: reason },
                    { name: 'Levée du mute', value: time(date, TimestampStyles.RelativeTime) }
                ))

            const guildMember = interaction.guild.members.cache.get(member.id)
            await guildMember.roles.add(muteRole)

            try {
                const muteMessage = `🇫🇷 ${Locales.get('fr', 'mute_message', inlineCode(reason), time(date, TimestampStyles.RelativeTime))}`
                    + '\n\n━━━━━━━━━━━━━━━\n\n'
                    + `🇬🇧 ${Locales.get('en-US', 'mute_message', inlineCode(reason), time(date, TimestampStyles.RelativeTime))}`
                await member.send({ content: muteMessage })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }
            
            await logsChannel.send({ embeds: embeds })

            Logger.log('MuteCommand', 'INFO', `Le membre ${member.user.tag} a été mute par ${interaction.user.tag}`)

            await interaction.reply({ content: Locales.get(interaction.locale, 'member_muted', userMention(member.id)), ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}