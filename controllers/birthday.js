const { Client } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const { Birthdays, BirthdayMessages } = require('./database')
const { Sequelize } = require('sequelize')
const crypto = require('crypto')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute une date d'anniversaire dans la base de données
     * @param {String} memberId identifiant du membre
     * @param {Number} date date de naissance au format timestamp
     */
    set: async function(memberId, date) {
        await Birthdays.create({
            memberId: memberId,
            date: date
        })
    },

    /**
     * Récupère la liste des anniversaire pour les membres dont c'est l'anniversaire ce jour
     * @returns {Promise<Array.<{id: Number, memberId: String, date: Date}>>} liste des anniversaires
     */
    get: async function() {
        const date = ((new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })).substr(0, 5)

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

        const guild = client.guilds.cache.find(g => g.id === config.guild.id)
        const happyBirthdayChannel = guild.channels.cache.get(config.guild.channels.happyBirthday.id)

        for(const birthday of birthdays) {
            const member = guild.members.cache.get(birthday.memberId)

            if(member) {
                let message = ''
                if(bdMessages.length > 0) {
                    const random = crypto.randomInt(bdMessages.length)
                    message = bdMessages[random].message
                }

                Logger.log('BirthdayWish', 'INFO', `Joyeux anniversaire ${member.user.tag}`)

                happyBirthdayChannel.send(message + userMention(member.user.id))
            }
        }
    }
}