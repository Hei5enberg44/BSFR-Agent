class JoinThread {
    name = "JoinThread"

    constructor(opt) {
        this.clients        = opt.clients
        this.config         = opt.config
        this.utils          = opt.utils
    }

    async listen(data) {
        await this.clients.mongo.insert("historical", {
            "type"      : "threadCreated",
            "userId"    : data.owner_id,
            "channelId" : data.parent_id,
            "name"      : data.name,
            "date"      : (new Date()).getTime(),
        })

        const guild     = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const channel   = guild.channels.cache.get(data.parent_id)
        const thread    = channel.threads.cache.get(data.id)

        if(thread.id) {
            this.utils.logger.log("[JoinThread] Thread successfully found")
            thread.members.add(this.config.discord.clientId)
            thread.send({content: "Coucou"})
            this.utils.logger.log("[JoinThread] Thread successfully joined")
        } else {
            this.utils.logger.log("[JoinThread] Can't find the thread " + data.name)
        }
    }
}

module.exports = JoinThread;