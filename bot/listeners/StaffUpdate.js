class StaffUpdate {
    name = "StaffUpdate"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        const member        = this.guild.members.cache.get(data.user.id)
        const adminMembers  = this.guild.roles.cache.get(this.config.ids.roles.admin).members
        const modoMembers   = this.guild.roles.cache.get(this.config.ids.roles.moderator).members
        // Check if the member was in staff
        const memberInStaff = adminMembers.concat(modoMembers).find(modoMember => modoMember.user.id === data.user.id)

        // If the member was not in staff and got a staff roles OR if the member was in staff and don't have any staff role anymore
        if(
            (!memberInStaff && data.roles !== undefined && data.roles.some(role=>[this.config.ids.roles.admin, this.config.ids.roles.moderator].includes(role)))
            || (memberInStaff && (data.roles === undefined || !data.roles.some(role=>[this.config.ids.roles.admin, this.config.ids.roles.moderator].includes(role))))
        ) {
            const dmChannel = this.guild.channels.cache.get(this.config.ids.channels.agentDm)
            const threads   = await this.clients.mongo.find("threads", {"type": "dm"})

            await dmChannel.threads.fetch()
            await dmChannel.threads.fetchArchived()

            // For each DM Threads
            for(const [, dbThread] of threads.entries()) {
                const thread = await dmChannel.threads.cache.get(dbThread.threadId)
                let threadArchived = false

                if(thread.archived) {
                    threadArchived = true
                    await thread.setArchived(false)
                }

                // Adding the member to the thread if he is new to staff, removing him if he leaves the staff
                if(!memberInStaff && data.roles !== undefined && data.roles.some(role=>[this.config.ids.roles.admin, this.config.ids.roles.moderator].includes(role))) {
                    this.utils.logger.log("[StaffUpdate] Adding " + member.user.tag + " to the thread '" + thread.name + "'")
                    await thread.members.add(member.user.id)
                } else {
                    this.utils.logger.log("[StaffUpdate] Removing " + member.user.tag + " from the thread '" + thread.name + "'")
                    await thread.members.remove(member.user.id)
                }

                // If the thread was archived, re-archive it
                if(threadArchived)
                    await thread.setArchived(true)
            }
        }
    }
}

module.exports = StaffUpdate;