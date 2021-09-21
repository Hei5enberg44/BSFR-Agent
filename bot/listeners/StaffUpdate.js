class StaffUpdate {
    name = "StaffUpdate"

    constructor(opt) {
        this.clients        = opt.clients
        this.config         = opt.config
        this.utils          = opt.utils
    }

    async listen(data) {
        const guild         = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const adminMembers  = guild.roles.cache.get(this.config.ids.roles.admin).members
        const modoMembers   = guild.roles.cache.get(this.config.ids.roles.moderator).members
        const memberInStaff = adminMembers.concat(modoMembers).find(modoMember => modoMember.user.id === data.user.id)
        const member        = guild.members.cache.get(data.user.id)

        if(!memberInStaff && data.roles !== undefined && data.roles.some(role=>[this.config.ids.roles.admin, this.config.ids.roles.moderator].includes(role))) {
            const dmChannel = guild.channels.cache.get(this.config.ids.channels.agentDm)
            const threads   = await this.clients.mongo.find("threads", {"type": "dm"})

            await dmChannel.threads.fetch()
            await dmChannel.threads.fetchArchived()

            for(const [, dbThread] of threads.entries()) {
                const thread = await dmChannel.threads.cache.get(dbThread.threadId)
                let threadArchived = false

                this.utils.logger.log("[StaffUpdate] Adding " + member.user.tag + " to the thread '" + thread.name + "'")

                if(thread.archived) {
                    threadArchived = true
                    await thread.setArchived(false)
                }

                await thread.members.add(member.user.id)

                if(threadArchived)
                    await thread.setArchived(true)
            }
        } else if(memberInStaff && (data.roles === undefined || !data.roles.some(role=>[this.config.ids.roles.admin, this.config.ids.roles.moderator].includes(role)))) {
            const dmChannel = guild.channels.cache.get(this.config.ids.channels.agentDm)
            const threads   = await this.clients.mongo.find("threads", {"type": "dm"})

            await dmChannel.threads.fetch()
            await dmChannel.threads.fetchArchived()

            for(const [, dbThread] of threads.entries()) {
                const thread = await dmChannel.threads.cache.get(dbThread.threadId)
                let threadArchived = false

                this.utils.logger.log("[StaffUpdate] Removing " + member.user.tag + " from the thread '" + thread.name + "'")

                if(thread.archived) {
                    threadArchived = true
                    await thread.setArchived(false)
                }

                await thread.members.remove(member.user.id)

                if(threadArchived)
                    await thread.setArchived(true)
            }
        }
    }
}

module.exports = StaffUpdate;