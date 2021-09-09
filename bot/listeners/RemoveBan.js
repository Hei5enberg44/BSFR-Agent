class RemoveBan {
    name = "RemoveBan"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async listen(data) {
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const channel = guild.channels.cache.get(this.config.ids.channels.logs)

        let title = "🔨 Déban de " + data.user.username

        this.utils.logger.log("[RemoveBan] " + title)

        let embed = this.utils.embed.embed().setTitle(title)
            .setColor('#f07848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField("Utilisateur", "<@!" + data.user.id + ">")

        channel.send({embeds: [embed]})
    }
}

module.exports = RemoveBan;