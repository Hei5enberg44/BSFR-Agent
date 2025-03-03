import { Client, Guild, MessageReaction, User, TextChannel, userMention, roleMention, bold, italic, time, TimestampStyles, MessageFlags } from 'discord.js'
import Embed from '../utils/embed.js'
import { BanModel, ReactionModel, BanReactionData } from '../controllers/database.js'
import { Op } from 'sequelize'
import reactions, { ReactionType } from './reactions.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

export default class Bans {
    /**
     * Ajoute un ban dans la base de données
     * @param memberId identifiant du membre
     * @param bannedBy identifiant du membre réalisant la demante de ban
     * @param approvedBy identifiant du membre approuvant la demante de ban
     * @param reason raison du ban
     * @param channelId channel où a été effectuée la demande de ban (facultatif)
     * @param messageId identifiant du message correspondant à la demande de ban (facultatif)
     * @param unbanDate date de déban
     */
    static async add(memberId: string, bannedBy: string, approvedBy: string | null, reason: string, unbanDate: Date, channelId?: string, messageId?: string) {
        const banDate = bannedBy === approvedBy ? new Date() : null

        const ban = await BanModel.create({
            memberId: memberId,
            bannedBy: bannedBy,
            approvedBy: approvedBy,
            reason: reason,
            banDate: banDate,
            unbanDate: unbanDate
        })

        if(!approvedBy && channelId && messageId) {
            await reactions.add(
                ReactionType.BanRequest,
                { banId: ban.id },
                { memberId: bannedBy, channelId: channelId },
                messageId
            )
        }
    }

    /**
     * Approuve une demande de ban
     * @param banId identifiant du ban
     * @param approvedBy identifiant du membre approuvant la demande de ban
     */
    static async approve(banId: number, approvedBy: string) {
        await BanModel.update({
            approvedBy: approvedBy,
            banDate: new Date()
        }, {
            where: { id: banId }
        })
    }

    /**
     * Récupère les informations d'un ban par rapport à son identifiant
     * @param id identifiant du ban
     * @returns informations du ban
     */
    static async get(id: number) {
        const ban = await BanModel.findOne({
            where: {
                id: id
            }
        })
        return ban
    }

    /**
     * Récupère la liste des membres bannis
     * @returns liste des membres bannis
     */
    static async list() {
        const bans = await BanModel.findAll({
            where: {
                unbanDate: {
                    [Op.lte]: new Date()
                }
            }
        })
        return bans
    }

    /**
     * Supprime un ban de la base de donnée
     * @param id identifiant du ban
     */
    static async remove(id: number) {
        await BanModel.destroy({
            where: {
                id: id
            }
        })
    }

    /**
     * Test si un membre est banni
     * @param memberId identifiant du membre
     * @returns données concernant le ban
     */
    static async isBanned(memberId: string) {
        const banned = await BanModel.findOne({
            where: {
                memberId: memberId
            }
        })
        return banned
    }

    /**
     * Détermine la date de déban en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param duration durée du ban
     * @returns date de de déban
     */
    static getUnbanDate(duration: string): Date|false {
        const unit = duration.charAt(duration.length - 1).toUpperCase()
        const time = parseInt(duration.slice(0, -1))
        const date = new Date()
    
        switch(unit) {
            case 'S':
                date.setSeconds(date.getSeconds() + time)
                break
            case 'I':
                date.setMinutes(date.getMinutes() + time)
                break
            case 'H':
                date.setHours(date.getHours() + time)
                break
            case 'D':
                date.setDate(date.getDate() + time)
                break
            case 'W':
                date.setDate(date.getDate() + (time * 7))
                break
            case 'M':
                date.setMonth(date.getMonth() + time)
                break
            case 'Y':
                date.setFullYear(date.getFullYear() + time)
                break
            default:
                return false
        }
    
        if(date.toString().toLowerCase() === 'invalid date')
            return false
    
        return date
    }

    /**
     * Ban d'un membre
     * @param reaction The reaction object
     * @param user The user that applied the guild or reaction emoji
     * @param r données concernant la réaction
     */
    static async ban(reaction: MessageReaction, user: User, r: ReactionModel<BanReactionData>) {
        const banId = r.data.banId
        const banInfos = await this.get(banId)

        if(banInfos) {
            const guild = <Guild>reaction.client.guilds.cache.get(config.guild.id)
            const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])
            const member = guild.members.cache.get(banInfos.memberId)

            if(member) {
                const embeds = []

                const embed = new Embed()
                    .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(banInfos.memberId) },
                        { name: 'Ban demandé par', value: userMention(banInfos.bannedBy) }
                    )

                if(reaction.emoji.name === '✅') {
                    embeds.push(embed.setColor('#2ECC71')
                        .setTitle(`🔨 [ACCEPTÉ] Demande de ban de ${member.user.username}`)
                        .addFields(
                            { name: 'Demande approuvée par', value: userMention(user.id), inline: true },
                            { name: 'Raison', value: banInfos.reason },
                            { name: 'Levée du ban', value: time(banInfos.unbanDate, TimestampStyles.RelativeTime) }
                        ))

                    await this.approve(banId, user.id)
                    await ReactionModel.destroy({ where: { id: r.id } })

                    await logsChannel.send({ embeds: embeds })

                    try {
                        const banMessage = `🇫🇷 ${Locales.get('fr', 'ban_approved_message', time(banInfos.unbanDate, TimestampStyles.RelativeTime))}`
                            + '\n\n━━━━━━━━━━━━━━━\n\n'
                            + `🇬🇧 ${Locales.get('en-US', 'ban_approved_message', time(banInfos.unbanDate, TimestampStyles.RelativeTime))}`
                        await member.send({ content: banMessage })
                    } catch(error) {
                        embeds.push(new Embed()
                            .setColor('#E74C3C')
                            .setDescription('Le message n\'a pas pu être envoyé au membre'))
                    }

                    await member.timeout(null)
                    await member.ban({ reason: banInfos.reason })

                    await reaction.message.reactions.removeAll()
                    await reaction.message.edit({ embeds: embeds })

                    Logger.log('BanCommand', 'INFO', `La demande de ban pour ${member.user.username} a été acceptée par ${user.username}`)
                } else if(reaction.emoji.name === '❌') {
                    embeds.push(embed.setColor('#2ECC71')
                        .setTitle(`🔨 [REFUSÉ] Demande de ban de ${member.user.username}`)
                        .addFields(
                            { name: 'Demande refusée par', value: userMention(user.id), inline: true },
                            { name: 'Raison', value: banInfos.reason },
                            { name: 'Levée du ban', value: time(banInfos.unbanDate, TimestampStyles.RelativeTime) },
                        ))

                    await member.timeout(null)

                    await this.remove(banId)
                    await ReactionModel.destroy({ where: { id: r.id } })

                    await logsChannel.send({ embeds: embeds })

                    try {
                        const banMessage = `🇫🇷 ${Locales.get('fr', 'ban_not_approved_message')}`
                            + '\n\n━━━━━━━━━━━━━━━\n\n'
                            + `🇬🇧 ${Locales.get('en-US', 'ban_not_approved_message')}`
                        await member.send({ content: banMessage })
                    } catch(error) {
                        embeds.push(new Embed()
                            .setColor('#E74C3C')
                            .setDescription('Le message n\'a pas pu être envoyé au membre'))
                    }

                    await reaction.message.reactions.removeAll()
                    await reaction.message.edit({ embeds: embeds })

                    Logger.log('BanCommand', 'INFO', `La demande de ban pour ${member.user.username} a été refusée par ${user.username}`)
                }
            }
        }
    }

    /**
     * Deban les membres pour qui la date de fin de ban est passée
     * @param client client Discord
     */
    static async unban(client: Client) {
        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const bans = await this.list()

        for(const ban of bans) {
            if(ban.approvedBy) {
                guild.bans.fetch(ban.memberId).then(async (guildBan) => {
                    await this.remove(ban.id)

                    if(guildBan) {
                        // On envoie un message aux modérateurs pour leur demander d'envoyer le lien d'invitation du serveur au membre
                        const moderationChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['modération'])
                        await moderationChannel.send({ content: `${roleMention(config.guild.roles["Modérateur"])} — ${bold('Fin du ban pour')} ${userMention(guildBan.user.id)}\n\nMerci de prévenir le membre ainsi que de lui envoyer le lien d'invitation pour le serveur.\n\n${italic(`Lien d'invitation : ${config.links.discordInvite}`)}`, flags: MessageFlags.SuppressEmbeds })
        
                        await guild.members.unban(guildBan.user.id)
                        await this.remove(ban.id)
        
                        Logger.log('Unban', 'INFO', `Le ban pour ${guildBan.user.username} est terminé`)
                    }
                }).catch(() => {
                    Logger.log('Unban', 'ERROR', `Le membre "${ban.memberId}" est introuvable dans la liste des bans`)
                })
            }
        }
    }
}