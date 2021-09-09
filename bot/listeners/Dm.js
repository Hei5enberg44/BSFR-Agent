class Dm {
    name = "DM"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async listen(data) {
        if(data.guild_id === undefined && data.author.id !== this.config.discord.clientId) {
            const guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
            const channel = guild.channels.cache.get(this.config.ids.channels.agentDm)

            this.utils.logger.log("[Dm] Receiving DM from " + data.author.username + "#" + data.author.discriminator)

            channel.send({content: "<@!" + data.author.id + ">: " + data.content})
        }
    }
}

module.exports = Dm;