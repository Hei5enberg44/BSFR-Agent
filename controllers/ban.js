import { Client, MessageReaction, User, TextChannel, userMention, roleMention, bold, italic, time, TimestampStyles, MessageFlags } from 'discord.js'
import Embed from '../utils/embed.js'
import { Bans, Reactions } from '../controllers/database.js'
import { Op } from 'sequelize'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un ban dans la base de données
     * @param {string} memberId identifiant du membre
     * @param {string} bannedBy identifiant du membre réalisant la demante de ban
     * @param {string} approvedBy identifiant du membre approuvant la demante de ban
     * @param {string} reason raison du ban
     * @param {string|null} channelId channel où a été effectuée la demande de ban (facultatif)
     * @param {string|null} messageId identifiant du message correspondant à la demande de ban (facultatif)
     * @param {Date} unbanDate date de déban
     */
    async add(memberId, bannedBy, approvedBy, reason, unbanDate, channelId = null, messageId = null) {
        const banDate = bannedBy === approvedBy ? new Date() : null

        const ban = await Bans.create({
            memberId: memberId,
            bannedBy: bannedBy,
            approvedBy: approvedBy,
            reason: reason,
            banDate: banDate,
            unbanDate: unbanDate
        })

        if(!approvedBy) {
            await Reactions.create({
                type: 'banRequest',
                data: {
                    banId: ban.id
                },
                interaction: {
                    memberId: bannedBy,
                    channelId: channelId
                },
                messageId: messageId
            })
        }
    },

    /**
     * Approuve une demande de ban
     * @param {number} banId identifiant du ban
     * @param {string} approvedBy identifiant du membre approuvant la demande de ban
     */
    async approve(banId, approvedBy) {
        await Bans.update({
            approvedBy: approvedBy,
            banDate: new Date()
        }, {
            where: { id: banId }
        })
    },

    /**
     * @typedef {Object} MemberBan
     * @property {number} id
     * @property {string} memberId
     * @property {string} bannedBy
     * @property {string} approvedBy
     * @property {string} reason
     * @property {Date} banDate
     * @property {Date} unbanDate
     */

    /**
     * Récupère les informations d'un ban par rapport à son identifiant
     * @param {number} banId identifiant du ban
     * @returns {Promise<MemberBan>} informations du ban
     */
    async get(banId) {
        const ban = await Bans.findOne({
            where: {
                id: banId
            }
        })

        return ban
    },

    /**
     * Récupère la liste des membres bannis
     * @returns {Promise<Array<MemberBan>>} liste des membres bannis
     */
    async list() {
        const bans = await Bans.findAll({
            where: {
                unbanDate: {
                    [Op.lte]: new Date()
                }
            }
        })

        return bans
    },

    /**
     * Supprime un ban de la base de donnée
     * @param {string} banId identifiant du ban
     */
    async remove(banId) {
        await Bans.destroy({
            where: {
                id: banId
            }
        })
    },

    /**
     * Test si un membre est banni
     * @param {string} memberId identifiant du membre
     * @returns {Promise<MemberBan|null>} données concernant le ban
     */
    async isBanned(memberId) {
        const banned = await Bans.findOne({
            where: {
                memberId: memberId
            }
        })

        return banned
    },

    /**
     * Détermine la date de déban en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param {string} duration durée du ban
     * @returns {Date} date de de déban
     */
    getUnbanDate(duration) {
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
    },

    /**
     * @typedef {Object} Reaction
     * @property {number} id
     * @property {string} type
     * @property {{banId: number}} data
     * @property {{memberId: string, channelId: string}} interaction
     * @property {string} messageId
     * @property {Date} date
     */

    /**
     * Ban d'un membre
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {Reaction} r données concernant la réaction
     */
    async ban(reaction, user, r) {
        const banId = r.data.banId
        const banInfos = await this.get(banId)

        const guild = reaction.client.guilds.cache.get(config.guild.id)
        /** @type {TextChannel} */
        const logsChannel = guild.channels.cache.get(config.guild.channels['logs'])
        const muteRole = guild.roles.cache.get(config.guild.roles['Muted'])
        const member = guild.members.cache.get(banInfos.memberId)

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
            await Reactions.destroy({ where: { id: r.id } })

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

            await member.ban({ days: 0, reason: banInfos.reason })

            await reaction.message.reactions.removeAll()
            await reaction.message.edit({ embeds: embeds })

            Logger.log('BanCommand', 'INFO', `La demande de ban pour ${member.user.tag} a été acceptée par ${user.tag}`)
        } else if(reaction.emoji.name === '❌') {
            embeds.push(embed.setColor('#2ECC71')
                .setTitle(`🔨 [REFUSÉ] Demande de ban de ${member.user.username}`)
                .addFields(
                    { name: 'Demande refusée par', value: userMention(user.id), inline: true },
                    { name: 'Raison', value: banInfos.reason },
                    { name: 'Levée du ban', value: time(banInfos.unbanDate, TimestampStyles.RelativeTime) },
                ))

            await member.roles.remove(muteRole)

            await this.remove(banId)
            await Reactions.destroy({ where: { id: r.id } })

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

            Logger.log('BanCommand', 'INFO', `La demande de ban pour ${member.user.tag} a été refusée par ${user.tag}`)
        }
    },

    /**
     * Deban les membres pour qui la date de fin de ban est passée
     * @param {Client} client client Discord
     */
    async unban(client) {
        const guild = client.guilds.cache.get(config.guild.id)
        const bans = await this.list()

        for(const ban of bans) {
            let guildBan = null
            
            try {
                guildBan = await guild.bans.fetch(ban.memberId)
            } catch(error) {
                await this.remove(ban.id)
                Logger.log('Unban', 'ERROR', `Le membre "${ban.memberId}" est introuvable dans la liste des bans`)
            }

            if(guildBan) {
                // On envoie un message aux modérateurs pour leur demander d'envoyer le lien d'invitation du serveur au membre
                /** @type {TextChannel} */
                const moderationChannel = guild.channels.cache.get(config.guild.channels['modération'])
                await moderationChannel.send({ content: `${roleMention(config.guild.roles["Modérateur"])} — ${bold('Fin du ban pour')} ${userMention(guildBan.user.id)}\n\nMerci de prévenir le membre ainsi que de lui envoyer le lien d'invitation pour le serveur.\n\n${italic(`Lien d'invitation : ${config.links.discordInvite}`)}`, flags: MessageFlags.SuppressEmbeds })

                await guild.members.unban(guildBan.user.id)
                await this.remove(ban.id)

                Logger.log('Unban', 'INFO', `Le ban pour ${guildBan.user.tag} est terminé`)
            }
        }
    }
}