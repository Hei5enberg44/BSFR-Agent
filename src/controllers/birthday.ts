import { Client, Guild, TextChannel, userMention } from 'discord.js'
import { BirthdayModel, BirthdayMessageModel, BirthdayWishesModel } from './database.js'
import { Sequelize, Op } from 'sequelize'
import crypto from 'crypto'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

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
     * Récupère un message d'anniversaire au hasard
     * 
     * @param history ne pas récupérer un message si celui-ci se trouve dans les x derniers messages envoyés
     */
    async getRandomBirthdayMessage(history: number = 5) {
        const lastBirthdayWishes = (await BirthdayWishesModel.findAll({
            order: [
                [ 'id', 'desc' ]
            ],
            attributes: [ 'birthdayMessageId' ],
            limit: history
        })).map(bw => bw.birthdayMessageId)

        const bdMessages = await BirthdayMessageModel.findAll({
            where: {
                id: {
                    [Op.notIn]: lastBirthdayWishes
                }
            },
            raw: true
        })

        if(bdMessages.length === 0) return 'Joyeux anniversaire !'

        const random = crypto.randomInt(bdMessages.length)
        const bdMessage = bdMessages[random]

        await BirthdayWishesModel.create({
            birthdayMessageId: bdMessage.id
        })

        return bdMessage.message
    },

    /**
     * Souhaite l'anniversaire aux membres pour qui c'est l'anniversaire ce jour
     * @param client client Discord
     */
    async wish(client: Client) {
        const birthdays = await this.get()

        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const happyBirthdayChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['happy-birthday'])

        for(const birthday of birthdays) {
            const member = guild.members.cache.get(birthday.memberId)

            if(member) {
                let mention = true
                let bdMessage = await this.getRandomBirthdayMessage()
                if(bdMessage.match(/!p/)) {
                    mention = false
                    bdMessage = bdMessage.replace(/!p/g, userMention(member.user.id))
                }

                Logger.log('BirthdayWish', 'INFO', `Joyeux anniversaire ${member.user.username} !`)

                await happyBirthdayChannel.send(`${bdMessage}${mention ? ` ${userMention(member.user.id)}` : ''}`)
            }
        }
    }
}