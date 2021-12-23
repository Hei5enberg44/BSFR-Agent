const { GuildMember } = require('discord.js')
const { Threads } = require('../controllers/database')
const { Op } = require('sequelize')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un thread dans la base de données
     * @param {string} type type de thread
     * @param {string} threadId identifiant du thread
     * @param {string} memberId identifiant du membre qui créer le thread
     */
    add: async function(type, threadId, memberId) {
        await Threads.create({
            type: type,
            threadId: threadId,
            memberId: memberId
        })
    },

    /**
     * Récupère un thread par son type et par son identifiant ou par le membre qui en est à l'origine
     * @param {string} type type de thread
     * @param {string|null} threadId identifiant du thread
     * @param {string|null} memberId identifiant du membre
     * @returns {Object} thread
     */
    get: async function(type, threadId, memberId) {
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
     * @returns {Object} threads
     */
    getByType: async function(type) {
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
    addMember: async function(type, member) {
        const agentDmChannel = member.guild.channels.cache.get(config.guild.channels.agentDm.id)
        const threads = await module.exports.getByType(type)

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
     removeMember: async function(type, member) {
        const agentDmChannel = member.guild.channels.cache.get(config.guild.channels.agentDm.id)
        const threads = await module.exports.getByType(type)

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