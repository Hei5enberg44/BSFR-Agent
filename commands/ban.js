import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, GuildMember, TextChannel, bold, inlineCode, userMention, roleMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import ban from '../controllers/ban.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member over a period of time')
        .setDescriptionLocalization('fr', 'Bannit un membre sur une période donnée')
        .addUserOption(option =>
            option.setName('member')
                .setNameLocalization('fr', 'membre')
                .setDescription('Member to ban')
                .setDescriptionLocalization('fr', 'Membre à bannir')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('reason')
                .setNameLocalization('fr', 'raison')
                .setDescription('Ban reason')
                .setDescriptionLocalization('fr', 'Raison du ban')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('duration')
                .setNameLocalization('fr', 'durée')
                .setDescription('Ban duration (s = seconds, i = minutes, h = hours, d = days, w = weeks, m = months, y = years)')
                .setDescriptionLocalization('fr', 'Durée du ban (s = secondes, i = minutes, h = heures, d = jours, w = semaines, m = mois, y = années)')
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

            // Si on essaie de bannir un Administrateur ou un Modérateur
            if(member.roles.cache.find(r => r.id === config.guild.roles['Admin'] || r.id === config.guild.roles['Modérateur']))
                throw new CommandInteractionError(Locales.get(interaction.locale, 'ban_admin_error'))

            // Si on essaie de bannir un bot
            if(member.user.bot) throw new CommandInteractionError(Locales.get(interaction.locale, 'ban_bot_error'))

            const isBanned = await ban.isBanned(member.id)
            if(isBanned) throw new CommandInteractionError(isBanned.approvedBy ? Locales.get(interaction.locale, 'already_banned_error', userMention(member.id)) : Locales.get(interaction.locale, 'existing_ban_request_error', userMention(member.id)))

            const date = ban.getUnbanDate(duration)

            if(!date) throw new CommandInteractionError(Locales.get(interaction.locale, 'invalid_duration', duration))

            /** @type {TextChannel} */
            const adminChannel = interaction.guild.channels.cache.get(config.guild.channels['admin'])
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles['Muted'])

            let askForBan = true
            if(interaction.member.roles.cache.find(r => r.id === config.guild.roles['Admin'])) askForBan = false

            const embeds = []

            if(askForBan) {
                embeds.push(new Embed()
                    .setColor('#9B59B6')
                    .setTitle(`🔨 Demande de ban pour ${member.user.tag}`)
                    .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(member.id), inline: true },
                        { name: 'Ban demandé par', value: userMention(interaction.user.id), inline: true },
                        { name: 'Raison', value: reason },
                        { name: 'Levée du ban', value: time(date, TimestampStyles.RelativeTime) }
                    ))

                const guildMember = interaction.guild.members.cache.get(member.id)
                await guildMember.roles.add(muteRole)

                try {
                    const banMessage = `🇫🇷 ${Locales.get('fr', 'ban_request_message', inlineCode(reason))}`
                        + '\n\n━━━━━━━━━━━━━━━\n\n'
                        + `🇬🇧 ${Locales.get('en-US', 'ban_request_message', inlineCode(reason))}`
                    await member.send({ content: banMessage })
                } catch(error) {
                    embeds.push(new Embed()
                        .setColor('#E74C3C')
                        .setDescription('Le message n\'a pas pu être envoyé au membre'))
                }

                const banMessage = await adminChannel.send({ content: roleMention(config.guild.roles['Admin']), embeds: embeds })

                await ban.add(member.id, interaction.user.id, null, reason, date, adminChannel.id, banMessage.id)

                await banMessage.react('✅')
                await banMessage.react('❌')

                Logger.log('BanCommand', 'INFO', `${interaction.user.tag} a effectué une demande de ban à l'encontre de ${member.tag}`)
                await interaction.reply({ content: Locales.get(interaction.locale, 'ban_request_sent'), ephemeral: true })
            } else {
                /** @type {TextChannel} */
                const logsChannel = interaction.guild.channels.cache.get(config.guild.channels['logs'])

                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setTitle(`🔨 Demande de ban pour ${member.user.tag}`)
                    .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(member.id), inline: true },
                        { name: 'Ban réalisé par', value: userMention(interaction.user.id), inline: true },
                        { name: 'Raison', value: reason },
                        { name: 'Levée du ban', value: time(date, TimestampStyles.RelativeTime) }
                    ))

                await ban.add(member.id, interaction.user.id, interaction.user.id, reason, date)

                await logsChannel.send({ embeds: embeds })

                try {
                    const banMessage = `🇫🇷 ${Locales.get('fr', 'ban_message', inlineCode(reason))}`
                        + '\n\n━━━━━━━━━━━━━━━\n\n'
                        + `🇬🇧 ${Locales.get('en-US', 'ban_message', inlineCode(reason))}`
                    await member.send({ content: banMessage })
                } catch(error) {
                    embeds.push(new Embed()
                        .setColor('#E74C3C')
                        .setDescription('Le message n\'a pas pu être envoyé au membre'))
                }

                await interaction.guild.members.cache.get(member.id).ban({ days: 0, reason: reason })

                await interaction.reply({ content: `${userMention(member.id)} a été banni`, ephemeral: true })
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}