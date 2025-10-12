import { GuildMember, TextChannel } from 'discord.js'
import { ThreadModel } from '../models/thread.model.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default class Threads {
    /**
     * Ajoute un thread dans la base de données
     * @param type type de thread
     * @param threadId identifiant du thread
     * @param memberId identifiant du membre qui créer le thread
     */
    static async add(type: string, threadId: string, memberId: string) {
        await ThreadModel.create({
            type: type,
            threadId: threadId,
            memberId: memberId
        })
    }

    /**
     * Récupère un thread par son type et par son identifiant ou par le membre qui en est à l'origine
     * @param type type de thread
     * @param threadId identifiant du thread
     * @param memberId identifiant du membre
     */
    static async get(
        type: string,
        threadId: string | null,
        memberId: string | null
    ) {
        let where: { threadId?: string; memberId?: string } = {}
        if (threadId) where.threadId = threadId
        if (memberId) where.memberId = memberId

        const thread = await ThreadModel.findOne({
            where: {
                type: type,
                ...where
            }
        })
        return thread
    }

    /**
     * Récupère des threads par leur type
     * @param type type de thread
     */
    static async getByType(type: string) {
        const threads = await ThreadModel.findAll({
            where: { type: type }
        })
        return threads
    }

    /**
     * Ajoute un membre dans les threads correspondant à un type défini
     * @param type type de threads dans lequel ajouter le membre
     * @param member membre à ajouter dans les threads
     */
    static async addMember(type: string, member: GuildMember) {
        const agentDmChannel = member.guild.channels.cache.get(
            config.guild.channels['agent-dm']
        ) as TextChannel
        const threads = await this.getByType(type)

        await agentDmChannel.threads.fetch()
        await agentDmChannel.threads.fetchArchived()

        for (const t of threads) {
            const thread = agentDmChannel.threads.cache.get(t.threadId)

            if (thread) {
                let threadArchived = false

                if (thread.archived) {
                    threadArchived = true
                    await thread.setArchived(false)
                }

                Logger.log(
                    'DM',
                    'INFO',
                    `Ajout de ${member.user.username} au thread "${thread.name}"`
                )
                await thread.members.add(member.user.id)

                if (threadArchived) await thread.setArchived(true)
            }
        }
    }

    /**
     * Supprime un membre des threads correspondant à un type défini
     * @param type type de threads dans lequel supprimer le membre
     * @param member membre à supprimer des threads
     */
    static async removeMember(type: string, member: GuildMember) {
        const agentDmChannel = member.guild.channels.cache.get(
            config.guild.channels['agent-dm']
        ) as TextChannel
        const threads = await this.getByType(type)

        await agentDmChannel.threads.fetch()
        await agentDmChannel.threads.fetchArchived()

        for (const t of threads) {
            const thread = agentDmChannel.threads.cache.get(t.threadId)

            if (thread) {
                let threadArchived = false

                if (thread.archived) {
                    threadArchived = true
                    await thread.setArchived(false)
                }

                Logger.log(
                    'DM',
                    'INFO',
                    `Suppression de ${member.user.username} du thread "${thread.name}"`
                )
                await thread.members.remove(member.user.id)

                if (threadArchived) await thread.setArchived(true)
            }
        }
    }
}
