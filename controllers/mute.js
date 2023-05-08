import { Client, GuildMember, TextChannel, userMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { Mutes } from '../controllers/database.js'
import { Op } from 'sequelize'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un mute dans la base de données
     * @param {string} memberId identifiant du membre
     * @param {string} mutedBy identifiant du membre réalisant la demante de mute
     * @param {string} reason raison du mute
     * @param {Date} unmuteDate date d'unmute
     */
    async add(memberId, mutedBy, reason, unmuteDate) {
        await Mutes.create({
            memberId: memberId,
            mutedBy: mutedBy,
            reason: reason,
            muteDate: new Date(),
            unmuteDate: unmuteDate
        })
    },

    /**
     * Supprime un mute de la base de donnée
     * @param {string} memberId identifiant du membre
     */
    async remove(memberId) {
        await Mutes.destroy({
            where: {
                memberId: memberId
            }
        })
    },

    /**
     * @typedef {Object} MemberMute
     * @property {number} id
     * @property {string} memberId
     * @property {string} mutedBy
     * @property {string} reason
     * @property {Date} muteDate
     * @property {Date} unmuteDate
     */

    /**
     * Test si un membre est muted
     * @param {string} memberId identifiant du membre
     * @returns {Promise<MemberMute|null>} données concernant le mute
     */
    async isMuted(memberId) {
        const muted = await Mutes.findOne({
            where: {
                memberId: memberId
            }
        })

        return muted
    },

    /**
     * Détermine la date d'unmute en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param {string} duration durée du mute
     * @returns {Date} date de d'unmute
     */
    getUnmuteDate(duration) {
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
     * Si le membre avait été mute avant son départ et que le mute n'est pas terminé, on le mute à nouveau
     * @param {GuildMember} member The member that has joined a guild
     */
    async remute(member) {
        const isMuted = await this.isMuted(member.user.id)

        if(isMuted && isMuted.unmuteDate > new Date()) {
            /** @type {TextChannel} */
            const logsChannel = member.guild.channels.cache.get(config.guild.channels['logs'])
            const muteRole = member.guild.roles.cache.get(config.guild.roles.Muted)

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle(`🔇 Re mute de ${member.user.username}`)
                .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                .addFields(
                    { name: 'Le vilain', value: userMention(isMuted.memberId) },
                    { name: 'Mute réalisé par', value: userMention(isMuted.mutedBy) },
                    { name: 'Raison', value: isMuted.reason },
                    { name: 'Levée du mute', value: time(isMuted.unmuteDate, TimestampStyles.RelativeTime) }
                )

            await member.roles.add(muteRole)
            await logsChannel.send({ embeds: [embed] })

            Logger.log('Mute', 'INFO', `Le membre ${member.user.tag} est toujours mute`)
        }
    },

    /**
     * Démute un membre
     * @param {Client} client client Discord
     */
    async unmute(client) {
        const guild = client.guilds.cache.get(config.guild.id)
        /** @type {TextChannel} */
        const logsChannel = guild.channels.cache.get(config.guild.channels.logs)
        const muteRole = guild.roles.cache.get(config.guild.roles.Muted)

        const mutedMembers = await Mutes.findAll({
            where: {
                unmuteDate: { [Op.lte]: new Date() }
            }
        })

        for(const mutedMember of mutedMembers) {
            const embeds = []
            const memberToUnmute = guild.members.cache.get(mutedMember.memberId)

            await this.remove(mutedMember.memberId)

            if(memberToUnmute) {
                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setTitle(`🔇 Unmute de ${memberToUnmute.user.username}`)
                    .setThumbnail(memberToUnmute.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(mutedMember.memberId), inline: true },
                        { name: 'Mute réalisé par', value: userMention(mutedMember.mutedBy), inline: true },
                        { name: 'Raison', value: mutedMember.reason }
                    ))
    
                await memberToUnmute.roles.remove(muteRole)
    
                try {
                    const unmuteMessage = `🇫🇷 ${Locales.get('fr', 'unmute_message')}`
                        + '\n\n━━━━━━━━━━━━━━━\n\n'
                        + `🇬🇧 ${Locales.get('en-US', 'unmute_message')}`
                    await memberToUnmute.send({ content: unmuteMessage })
                } catch(error) {
                    embeds.push(new Embed()
                        .setColor('#E74C3C')
                        .setDescription('Le message n\'a pas pu être envoyé au membre'))
                }

                Logger.log('UnmuteCommand', 'INFO', `Le membre ${memberToUnmute.user.tag} a été unmute`)
            } else {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setTitle(`🔇 Unmute de ${memberToUnmute.user.username}`)
                    .setDescription('Le membre n\'est plus présent sur le discord')
                    .addFields(
                        { name: 'Le vilain', value: userMention(mutedMember.memberId), inline: true },
                        { name: 'Mute réalisé par', value: userMention(mutedMember.mutedBy), inline: true },
                        { name: 'Raison', value: mutedMember.reason }
                    ))

                Logger.log('UnmuteCommand', 'INFO', `Le membre "${mutedMember.memberId}" n'a pas été unmute car celui-ci n'est plus présent sur le serveur`)
            }

            await logsChannel.send({ embeds: embeds })
        }
    }
}