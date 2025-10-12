import { GuildMember } from 'discord.js'
import threads from '../controllers/threads.js'
import config from '../../config.json' with { type: 'json' }

export default class guildMemberUpdate {
    private static oldMember: GuildMember
    private static newMember: GuildMember

    /**
     * Emitted whenever a guild member changes - i.e. new role, removed role, nickname
     * @param oldMember The member before the update
     * @param newMember The member after the update
     */
    static async execute(oldMember: GuildMember, newMember: GuildMember) {
        this.oldMember = oldMember
        this.newMember = newMember

        await this.updateThreads()
    }

    /**
     * Ajoute ou supprime un membre des threads de messages privés si celui-ci rejoint ou quitte le staff
     */
    private static async updateThreads() {
        const oldMember = this.oldMember
        const newMember = this.newMember

        const wasInStaff = oldMember.roles.cache.find((r) =>
            [
                config.guild.roles['Admin'],
                config.guild.roles['Modérateur']
            ].includes(r.id)
        )
        const isInStaff = newMember.roles.cache.find((r) =>
            [
                config.guild.roles['Admin'],
                config.guild.roles['Modérateur']
            ].includes(r.id)
        )

        if (!wasInStaff && isInStaff) {
            // Si le membre a rejoint le staff
            await threads.addMember('dm', newMember)
        } else if (wasInStaff && !isInStaff) {
            // Si le membre a quiité le staff
            await threads.removeMember('dm', newMember)
        }
    }
}
