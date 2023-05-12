import { Client } from 'discord.js'
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

export default class Crons {
    private client: Client

    constructor(client: Client) {
        this.client = client
    }

    /**
     * Souhaite l'anniversaire aux membres pour qui c'est l'anniversaire ce jour
     */
    async birthdayWish() {
        new CronJob('0 0 * * *', async () => {
            await birthday.wish(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "birthdayWish" chargée')
    }

    /**
     * Démute les membres pour qui la date de démute est passée
     */
    async unmute() {
        new CronJob('*/30 * * * * *', async () => {
            await mute.unmute(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unmute" chargée')
    }

    /**
     * Déban les membres pour qui la date d'unban est passée
     */
    async unban() {
        new CronJob('* * * * *', async () => {
            await ban.unban(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "unban" chargée')
    }

    /**
     * Publication des nouvelles vidéos de la chaîne YouTube Beat Saber FR
     * dans le salon #youtube
     */
    async publish() {
        new CronJob('5 19-23 * * *', async () => {
            await youtube.publish(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "publish" chargée')
    }

    /**
     * Recherche les membres en live sur Twitch et envoie une notification dans le salon #twitch-youtube
     */
    async live() {
        new CronJob('*/5 * * * *', async () => {
            await twitch.live(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "live" chargée')
    }

    /**
     * Vérifie la présence d'une nouvelle mise à jour de Beat Saber et publie son contenu dans le salon #bs-updates
     */
    async checkBSUpdate() {
        new CronJob('*/15 * * * *', async () => {
            const update = await checkBSUpdate.getLastUpdate()
            if(update) await checkBSUpdate.postUpdate(this.client, update)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "checkBSUpdate" chargée')
    }

    /**
     * Supprime les réactions pour les sondages terminés
     */
    async finishPolls() {
        new CronJob('* * * * *', async () => {
            await poll.finish(this.client)
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "finishPolls" chargée')
    }

    /**
     * Réinitialise tous les quotas
     */
    async resetQuotas() {
        new CronJob('0 0 1 * *', async () => {
            await quotas.resetAll()
        }, null, true, 'Europe/Paris')

        Logger.log('CronManager', 'INFO', 'Tâche "resetQuotas" chargée')
    }
}