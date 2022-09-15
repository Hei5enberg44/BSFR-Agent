import { GuildMember } from 'discord.js'
import { Threads } from '../controllers/database.js'
import { Op } from 'sequelize'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un thread dans la base de données
     * @param {string} type type de thread
     * @param {string} threadId identifiant du thread
     * @param {string} memberId identifiant du membre qui créer le thread
     */
    async add(type, threadId, memberId) {
        await Threads.create({
            type: type,
            threadId: threadId,
            memberId: memberId
        })
    },

    /**
     * @typedef {Object} Thread
     * @property {string} type
     * @property {string} threadId
     * @property {string} memberId
     * @property {Date} date
     */

    /**
     * Récupère un thread par son type et par son identifiant ou par le membre qui en est à l'origine
     * @param {string} type type de thread
     * @param {string|null} threadId identifiant du thread
     * @param {string|null} memberId identifiant du membre
     * @returns {Promise<Thread>} thread
     */
    async get(type, threadId, memberId) {
        const thread = await Threads.findOne({
            where: {
                type: type,
                [Op.or]: [
                    { threadId: threadId },
                    { memberId: memberId }
                ]
            }
        })

        return thread
    },

    /**
     * Récupère des threads par leur type
     * @param {string} type type de thread
     * @returns {Promise<Array<Thread>>} threads
     */
    async getByType(type) {
        const threads = await Threads.findAll({
            where: { type: type }
        })

        return threads
    },

    /**
     * Ajoute un membre dans les threads correspondant à un type défini
     * @param {string} type type de threads dans lequel ajouter le membre
     * @param {GuildMember} member membre à ajouter dans les threads
     */
    async addMember(type, member) {
        const agentDmChannel = member.guild.channels.cache.get(config.guild.channels.agentDm)
        const threads = await this.getByType(type)

        await agentDmChannel.threads.fetch()
        await agentDmChannel.threads.fetchArchived()

        for(const t of threads) {
            const thread = await agentDmChannel.threads.cache.get(t.threadId)

            let threadArchived = false

            if(thread.archived) {
                threadArchived = true
                await thread.setArchived(false)
            }

            Logger.log('DM', 'INFO', `Ajout de ${member.user.tag} au thread "${thread.name}"`)
            await thread.members.add(member.user.id)

            if(threadArchived) await thread.setArchived(true)
        }
    },

    /**
     * Supprime un membre des threads correspondant à un type défini
     * @param {string} type type de threads dans lequel supprimer le membre
     * @param {GuildMember} member membre à supprimer des threads
     */
    async removeMember(type, member) {
        const agentDmChannel = member.guild.channels.cache.get(config.guild.channels.agentDm)
        const threads = await this.getByType(type)

        await agentDmChannel.threads.fetch()
        await agentDmChannel.threads.fetchArchived()

        for(const t of threads) {
            const thread = await agentDmChannel.threads.cache.get(t.threadId)

            let threadArchived = false

            if(thread.archived) {
                threadArchived = true
                await thread.setArchived(false)
            }

            Logger.log('DM', 'INFO', `Suppression de ${member.user.tag} du thread "${thread.name}"`)
            await thread.members.remove(member.user.id)

            if(threadArchived) await thread.setArchived(true)
        }
    }
}