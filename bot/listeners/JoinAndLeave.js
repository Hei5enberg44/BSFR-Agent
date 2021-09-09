class JoinAndLeave {
    name = "JoinAndLeave"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async listen(action, data) {
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const channel = guild.channels.cache.get(this.config.ids.channels.logs)

        let title   = action === "GUILD_MEMBER_ADD" ? "📥 Arrivée de " : "📤 Départ de "
        let color   = action === "GUILD_MEMBER_ADD" ? '#47EF66' : '#F04848'
        let message = action === "GUILD_MEMBER_ADD" ? "Koukou twa" : "Orevouar"

        this.utils.logger.log("[JoinAndLeave] " + title + data.user.username)

        let embed = this.utils.embed.embed().setTitle(title + data.user.username)
            .setColor(color)
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField(message, "<@!" + data.user.id + ">")

        channel.send({embeds: [embed]})
    }
}

module.exports = JoinAndLeave;