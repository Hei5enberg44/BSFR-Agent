import { Client, Guild, GuildMember, TextChannel, userMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { MuteModel } from '../controllers/database.js'
import { Op } from 'sequelize'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default class Mutes {
    /**
     * Ajoute un mute dans la base de données
     * @param memberId identifiant du membre
     * @param mutedBy identifiant du membre réalisant la demante de mute
     * @param reason raison du mute
     * @param unmuteDate date d'unmute
     */
    static async add(memberId: string, mutedBy: string, reason: string, unmuteDate: Date) {
        await MuteModel.create({
            memberId: memberId,
            mutedBy: mutedBy,
            reason: reason,
            muteDate: new Date(),
            unmuteDate: unmuteDate
        })
    }

    /**
     * Supprime un mute de la base de donnée
     * @param memberId identifiant du membre
     */
    static async remove(memberId: string) {
        await MuteModel.destroy({
            where: {
                memberId: memberId
            }
        })
    }

    /**
     * Test si un membre est muted
     * @param memberId identifiant du membre
     * @returns données concernant le mute
     */
    static async isMuted(memberId: string) {
        const muted = await MuteModel.findOne({
            where: {
                memberId: memberId
            }
        })
        return muted
    }

    /**
     * Détermine la date d'unmute en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param duration durée du mute
     * @returns date de d'unmute
     */
    static getUnmuteDate(duration: string) {
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
     * Si le membre avait été mute avant son départ et que le mute n'est pas terminé, on le mute à nouveau
     * @param member The member that has joined a guild
     */
    static async remute(member: GuildMember) {
        const isMuted = await this.isMuted(member.user.id)

        if(isMuted && isMuted.unmuteDate > new Date()) {
            const logsChannel = <TextChannel>member.guild.channels.cache.get(config.guild.channels['logs'])
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

            if(muteRole) await member.roles.add(muteRole)
            await logsChannel.send({ embeds: [embed] })

            Logger.log('Mute', 'INFO', `Le membre ${member.user.tag} est toujours mute`)
        }
    }

    /**
     * Démute un membre
     * @param client client Discord
     */
    static async unmute(client: Client) {
        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels.logs)
        const muteRole = guild.roles.cache.get(config.guild.roles.Muted)

        const mutedMembers = await MuteModel.findAll({
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
    
                if(muteRole) await memberToUnmute.roles.remove(muteRole)
    
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
                    .setTitle(`🔇 Unmute de ${userMention(mutedMember.memberId)}`)
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