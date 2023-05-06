import { Quotas } from './database.js'

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
    }
}