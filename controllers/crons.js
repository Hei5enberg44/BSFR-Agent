const CronJob = require('cron').CronJob
const birthday = require('../controllers/birthday')
const mute = require('../controllers/mute')
const ban = require('../controllers/ban')
const youtube = require('../controllers/youtube')
const twitch = require('../controllers/twitch')
const Logger = require('../utils/logger')

module.exports = {
    birthdayWish: async function(client) {
        new CronJob('0 0 * * *', async function () {
            await birthday.wish(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "birthdayWish" chargée')
    },

    unmute: async function(client) {
        new CronJob('* * * * *', async function () {
            await mute.unmute(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unmute" chargée')
    },

    unban: async function(client) {
        new CronJob('* * * * *', async function () {
            await ban.unban(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unban" chargée')
    },

    publish: async function(client) {
        new CronJob('5 19-23 * * *', async function () {
            await youtube.publish(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unban" chargée')
    },

    live: async function(client) {
        new CronJob('*/5 * * * *', async function () {
            await twitch.live(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "live" chargée')
    }
}