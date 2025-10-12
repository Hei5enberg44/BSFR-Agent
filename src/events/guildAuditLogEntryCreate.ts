import { Guild, GuildAuditLogsEntry } from 'discord.js'
import mute from '../controllers/mute.js'

export default class guildAuditLogEntryCreate {
    private static auditLog: GuildAuditLogsEntry
    private static guild: Guild

    /**
     * Emitted whenever a member is unbanned from a guild
     * @param auditLog Entrée du log d'audit
     * @param guild Guilde Discord
     */
    static async execute(auditLog: GuildAuditLogsEntry, guild: Guild) {
        this.auditLog = auditLog
        this.guild = guild

        await this.timeout()
    }

    /**
     * Mute/Démute un membre lors de l'utilisation de la fonction timeout de Discord
     */
    private static async timeout() {
        const auditLog = this.auditLog
        const guild = this.guild

        if (auditLog.actionType === 'Update') {
            const communicationDisabledUntilChange = auditLog.changes.find(
                (a) => a.key === 'communication_disabled_until'
            )
            if (
                communicationDisabledUntilChange &&
                auditLog.executorId &&
                auditLog.targetId
            ) {
                const executorMember = guild.members.cache.get(
                    auditLog.executorId
                )
                const targetMember = guild.members.cache.get(auditLog.targetId)
                if (executorMember && targetMember) {
                    const unmuteDate = communicationDisabledUntilChange.new
                    if (unmuteDate) {
                        const reason = auditLog.reason || ''
                        await mute.mute(
                            targetMember,
                            executorMember,
                            reason,
                            new Date(unmuteDate)
                        )
                    } else {
                        await mute.unmute(targetMember, executorMember)
                    }
                }
            }
        }
    }
}
