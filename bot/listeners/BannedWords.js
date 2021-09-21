class BannedWords {
    name = "BannedWords"

    constructor(opt) {
        this.clients        = opt.clients
        this.config         = opt.config
        this.utils          = opt.utils
    }

    async listen(data) {
        const bannedWords   = await this.clients.mongo.find("bannedWords", {})
        const guild         = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const channel       = guild.channels.cache.get(this.config.ids.channels.logs)

        let usedBannedWords = []

        for(const [, bannedWord] of bannedWords.entries()) {
            if(data.content.toLowerCase().includes(bannedWord.word.toLowerCase()) && usedBannedWords.indexOf(bannedWord.word) === -1) {
                usedBannedWords.push(bannedWord.word)
            }
        }

        if(usedBannedWords.length !== 0) {
            await this.clients.mongo.insert("historical", {
                "type"          : "forbiddenWords",
                "userId"        : data.author.id,
                "usedWords"     : usedBannedWords.join(", "),
                "messageLink"   : "https://discord.com/channels/" + data.guild_id + "/" + data.channel_id + "/" + data.id,
                "messageContent": data.content,
                "date"          : (new Date()).getTime(),
            })

            this.utils.logger.log("[ForbiddenWords] Found " + usedBannedWords.join(", ") +  " in " + data.author.username + "#" + data.author.discriminator + " message")

            let logsMessage = this.utils.embed.embed().setTitle("⛔ Usage de mots bannis")
                .setColor('#F04848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + data.author.id + "/" + data.author.avatar + ".png")
                .addField("Le vilain", "<@!" + data.author.id + ">")
                .addField("Les mots interdits utilisés", usedBannedWords.join(", "))
                .addField("Message", "[Lien](https://discord.com/channels/" + data.guild_id + "/" + data.channel_id + "/" + data.id + ") - " + data.content)

            channel.send({content: "<@&" + this.config.ids.roles.moderator + ">", embeds: [logsMessage]})
        }
    }
}

module.exports = BannedWords;