import { Client, Guild, TextChannel, userMention } from 'discord.js'
import { BirthdayModel, BirthdayMessageModel } from './database.js'
import { Sequelize } from 'sequelize'
import crypto from 'crypto'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute une date d'anniversaire dans la base de données
     * @param memberId identifiant du membre
     * @param date date de naissance au format timestamp
     */
    async set(memberId: string, date: Date) {
        const bd = await BirthdayModel.findOne({ where: { memberId: memberId } })

        if(bd) await this.unset(memberId)

        await BirthdayModel.create({
            memberId: memberId,
            date: date
        })
    },

    /**
     * Supprime une date d'anniversaire de la base de données
     * @param memberId identifiant du membre
     */
    async unset(memberId: string) {
        await BirthdayModel.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Récupère la liste des anniversaire pour les membres dont c'est l'anniversaire ce jour
     * @returns liste des anniversaires
     */
    async get() {
        const date = ((new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })).substring(0, 5)

        const birthdays = await BirthdayModel.findAll({
            where: Sequelize.where(Sequelize.fn('date_format', Sequelize.col('date'), '%d/%m'), date)
        })

        return birthdays
    },

    /**
     * Souhaite l'anniversaire aux membres pour qui c'est l'anniversaire ce jour
     * @param client client Discord
     */
    async wish(client: Client) {
        const birthdays = await this.get()
        const bdMessages = await BirthdayMessageModel.findAll()

        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const happyBirthdayChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['happy-birthday'])

        for(const birthday of birthdays) {
            const member = guild.members.cache.get(birthday.memberId)

            if(member) {
                let mention = true
                let message = 'Joyeux anniversaire !'
                if(bdMessages.length > 0) {
                    const random = crypto.randomInt(bdMessages.length)
                    message = bdMessages[random].message
                    if(message.match(/!p/)) {
                        mention = false
                        message = message.replace(/!p/g, userMention(member.user.id))
                    }
                }

                Logger.log('BirthdayWish', 'INFO', `Joyeux anniversaire ${member.user.tag} !`)

                await happyBirthdayChannel.send(`${message}${mention ? ` ${userMention(member.user.id)}` : ''}`)
            }
        }
    }
}