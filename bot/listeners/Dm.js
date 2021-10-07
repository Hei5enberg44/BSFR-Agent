class Dm {
    name = "DM"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        if(data.guild_id === undefined && data.author.id !== this.config.discord.clientId) {
            const agentDmChannel    = this.guild.channels.cache.get(this.config.ids.channels.agentDm)
            const adminMembers      = this.guild.roles.cache.get(this.config.ids.roles.admin).members
            const modoMembers       = this.guild.roles.cache.get(this.config.ids.roles.moderator).members

            // Create an array of staff members
            const members = adminMembers.concat(modoMembers)

            this.utils.logger.log("[Dm] Receiving DM from " + data.author.username)

            await this.clients.mongo.insert("historical", {
                "type"      : "dmReceived",
                "userId"    : data.author.id,
                "message"   : data.content,
                "date"      : (new Date()).getTime()
            })

            const createdThread = await this.clients.mongo.find("threads", {type: "dm", userId: data.author.id})
            let thread

            // If there is no thread for the user who DM
            if(createdThread.length === 0) {
                thread = await agentDmChannel.threads.create({
                    name: data.author.username,
                    autoArchiveDuration: 1440,
                    reason: 'DM de ' + data.author.tag
                });

                // If thread has been successfully created
                if(thread.id) {
                    this.utils.logger.log("[Dm] Thread successfully created")

                    // Adding every staff members to the thread
                    for(const [, member] of members) {
                        this.utils.logger.log("[Dm] Adding " + member.user.tag + " to the new thread")
                        await thread.members.add(member.user.id)
                    }

                    const mongoInserted = await this.clients.mongo.insert("threads", {type: "dm", threadId: thread.id, userId: data.author.id})

                    if(mongoInserted)
                        this.utils.logger.log("[Dm] Thread successfully inserted in DB")
                } else {
                    this.utils.logger.log("[Dm] Can't create thread")
                    agentDmChannel.send({content: "Can't create Thread\n<@!" + data.author.id + ">: " + data.content})
                }
            } else {
                thread = agentDmChannel.threads.cache.get(createdThread[0].threadId)

                if(thread.id)
                    this.utils.logger.log("[Dm] Thread successfully found for " + data.author.username)
                else
                    this.utils.logger.log("[Dm] Thread not found for " + data.author.username)
            }

            if(thread.id) {
                if(thread.archived) {
                    this.utils.logger.log("[Dm] Unarchiving Thread")
                    await thread.setArchived(false)
                }

                if(thread.locked) {
                    this.utils.logger.log("[Dm] Unlocking Thread")
                    await thread.setLocked(false)
                }

                thread.send({content: "<@!" + data.author.id + ">: " + data.content})
            }
        }
    }
}

module.exports = Dm;