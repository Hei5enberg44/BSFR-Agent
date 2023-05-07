import { Quotas } from './database.js'
import { Op } from 'sequelize'
import Logger from '../utils/logger.js'

export default {
    /**
     * Récupère un quota par rapport à son nom
     * @param {string} name nom du quota
     * @returns {Promise<{name: string, current: number|string, max: number|string}>} quota
     */
    async get(name) {
        const quota = await Quotas.findOne({
            where: {
                name: name
            }
        })

        return quota
    },

    /**
     * Réinitialise tous les quotas
     */
    async resetAll() {
        await Quotas.update({
            current: 0
        }, {
            where: {
                current: {
                    [Op.gt]: 0
                }
            }
        })

        Logger.log('Quotas', 'INFO', 'Les quotas ont été réinitialisés')
    }
}