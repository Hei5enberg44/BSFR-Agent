import { Op } from '@sequelize/core'
import { QuotaModel } from '../models/quota.model.js'
import Logger from '../utils/logger.js'

export default class Quotas {
    /**
     * Récupère un quota par rapport à son nom
     * @param name nom du quota
     * @returns quota
     */
    static async get(name: string) {
        const quota = await QuotaModel.findOne({
            where: {
                name: name
            }
        })
        return quota
    }

    /**
     * Réinitialise tous les quotas
     */
    static async resetAll() {
        await QuotaModel.update(
            {
                current: 0
            },
            {
                where: {
                    current: {
                        [Op.gt]: 0
                    }
                }
            }
        )

        Logger.log('Quotas', 'INFO', 'Les quotas ont été réinitialisés')
    }
}
