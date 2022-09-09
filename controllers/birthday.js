const { Client, userMention } = require('discord.js')
const { Birthdays, BirthdayMessages } = require('./database')
const { Sequelize } = require('sequelize')
const crypto = require('crypto')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute une date d'anniversaire dans la base de données
     * @param {string} memberId identifiant du membre
     * @param {Date} date date de naissance au format timestamp
     */
    set: async function(memberId, date) {
        const bd = await Birthdays.findOne({ where: { memberId: memberId } })

        if(bd) await module.exports.unset(memberId)

        await Birthdays.create({
            memberId: memberId,
            date: date
        })
    },

    /**
     * Supprime une date d'anniversaire de la base de données
     * @param {string} memberId identifiant du membre
     */
    unset: async function(memberId) {
        await Birthdays.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Récupère la liste des anniversaire pour les membres dont c'est l'anniversaire ce jour
     * @returns {Promise<Array<{id: number, memberId: string, date: Date}>>} liste des anniversaires
     */
    get: async function() {
        const date = ((new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })).substring(0, 5)

        const birthdays = await Birthdays.findAll({
            where: Sequelize.where(Sequelize.fn('date_format', Sequelize.col('date'), '%d/%m'), date)
        })

        return birthdays
    },

    /**
     * Souhaite l'anniversaire aux membres pour qui c'est l'anniversaire ce jour
     * @param {Client} client client Discord
     */
    wish: async function(client) {
        const birthdays = await module.exports.get()
        const bdMessages = await BirthdayMessages.findAll()

        const guild = client.guilds.cache.get(config.guild.id)
        const happyBirthdayChannel = guild.channels.cache.get(config.guild.channels.happyBirthday)

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