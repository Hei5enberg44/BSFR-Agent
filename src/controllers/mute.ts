import { Guild, GuildMember, TextChannel, userMention, time, TimestampStyles } from 'discord.js'
import Embed from '../utils/embed.js'
import { CronJob } from 'cron'
import { MuteModel } from '../controllers/database.js'
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
     * Récupère tous les membres mutés
     */
    static async getAll() {
        const mutedMembers = await MuteModel.findAll()
        return mutedMembers
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
     * Mute d'un membre
     * @param target Membre à muter
     * @param author Auteur du mute
     * @param reason Raison du mute
     * @param unmuteDate Date de démute
     */
    static async mute(target: GuildMember, author: GuildMember, reason: string, unmuteDate: Date) {
        if(!author.user.bot) {
            const client = author.client
            const guild = <Guild>client.guilds.cache.get(config.guild.id)
            const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels.logs)

            await this.add(target.id, author.id, reason, unmuteDate)

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle(`🔇 Mute de ${target.user.username}`)
                .setThumbnail(target.displayAvatarURL({ forceStatic: false }))
                .addFields(
                    { name: 'Le vilain', value: userMention(target.id), inline: true },
                    { name: 'Mute réalisé par', value: userMention(author.user.id), inline: true },
                    { name: 'Raison', value: reason.trim() !== '' ? reason : 'Pas de raison' },
                    { name: 'Levée du mute', value: time(unmuteDate, TimestampStyles.RelativeTime) }
                )

            await logsChannel.send({ embeds: [ embed ] })

            new CronJob(unmuteDate, async () => {
                await this.unmute(target)
            }, null, true, 'Europe/Paris')

            Logger.log('Mute', 'INFO', `Le membre ${target.user.tag} a été mute par ${author.user.tag}`)
        }
    }

    /**
     * Démute d'un membre
     * @param target Membre à démuter
     * @param author Auteur du démute
     */
    static async unmute(target: GuildMember, author?: GuildMember) {
        const client = target.client
        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels.logs)

        const mutedMember = await this.isMuted(target.id)
        if(mutedMember) {
            await this.remove(target.id)

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle(`🔇 Unmute de ${target.user.username}`)
                .setThumbnail(target.displayAvatarURL({ forceStatic: false }))
                .addFields(
                    { name: 'Le vilain', value: userMention(mutedMember.memberId), inline: true },
                    { name: 'Mute réalisé par', value: userMention(mutedMember.mutedBy), inline: true }
                )

            if(author) embed.addFields({ name: 'Mute levé par', value: userMention(author.id), inline: true })

            await logsChannel.send({ embeds: [ embed ] })

            if(author)
                Logger.log('Mute', 'INFO', `Le membre ${target.user.tag} a été unmute par ${author.user.tag}`)
            else
                Logger.log('Mute', 'INFO', `Le membre ${target.user.tag} a été unmute`)
        }
    }
}