import { CronJob } from 'cron'
import birthday from '../controllers/birthday.js'
import mute from '../controllers/mute.js'
import ban from '../controllers/ban.js'
import youtube from '../controllers/youtube.js'
import twitch from '../controllers/twitch.js'
import checkBSUpdate from '../controllers/checkBSUpdate.js'
import poll from '../controllers/poll.js'
import quotas from '../controllers/quotas.js'
import Logger from '../utils/logger.js'

export default {
    /**
     * Souhaite l'anniversaire aux membres pour qui c'est l'anniversaire ce jour
     * @param {Client} client client Discord
     */
    async birthdayWish(client) {
        new CronJob('0 0 * * *', async function () {
            await birthday.wish(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "birthdayWish" chargée')
    },

    /**
     * Démute les membres pour qui la date de démute est passée
     * @param {Client} client client Discord
     */
    async unmute(client) {
        new CronJob('*/30 * * * * *', async function () {
            await mute.unmute(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unmute" chargée')
    },

    /**
     * Déban les membres pour qui la date d'unban est passée
     * @param {Client} client client Discord
     */
    async unban(client) {
        new CronJob('* * * * *', async function () {
            await ban.unban(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unban" chargée')
    },

    /**
     * Publication des nouvelles vidéos de la chaîne YouTube Beat Saber FR
     * dans le salon #youtube
     * @param {Client} client client Discord
     */
    async publish(client) {
        new CronJob('5 19-23 * * *', async function () {
            await youtube.publish(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "publish" chargée')
    },

    /**
     * Recherche les membres en live sur Twitch et envoie une notification dans le salon #twitch-youtube
     * @param {Client} client client Discord
     */
    async live(client) {
        new CronJob('*/5 * * * *', async function () {
            await twitch.live(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "live" chargée')
    },

    /**
     * Vérifie la présence d'une nouvelle mise à jour de Beat Saber et publie son contenu dans le salon #bs-updates
     * @param {Client} client client Discord
     */
    async checkBSUpdate(client) {
        new CronJob('*/15 * * * *', async function () {
            const update = await checkBSUpdate.getLastUpdate()
            if(update) await checkBSUpdate.postUpdate(client, update)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "checkBSUpdate" chargée')
    },

    /**
     * Supprime les réactions pour les sondages terminés
     * @param {Client} client client Discord
     */
    async finishPolls(client) {
        new CronJob('* * * * *', async function () {
            await poll.finish(client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "finishPolls" chargée')
    },

    /**
     * Réinitialise tous les quotas
     */
    async resetQuotas() {
        new CronJob('0 0 1 * *', async function () {
            await quotas.resetAll()
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "resetQuotas" chargée')
    }
}