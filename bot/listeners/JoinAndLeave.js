class JoinAndLeave {
    name = "JoinAndLeave"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async listen(add, data) {
        const guild     = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const channel   = guild.channels.cache.get(this.config.ids.channels.logs)

        let title   = add ? "📥 Arrivée de " : "📤 Départ de "
        let color   = add ? '#47EF66' : '#F04848'
        let message = add ? "Koukou twa" : "Orevouar"

        if(add) {
            const user = await this.clients.mongo.find("users", {
                "discordId" : data.user.id,
                "unmuteDate": {$gt: (new Date()).getTime()}
            })

            if(user.length > 0) {
                this.utils.logger.log("[JoinAndLeave] " + data.user.tag + " is still muted.")

                let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)
                let muteRole    = guild.roles.cache.get(this.config.ids.roles.muted)
                let mutedMember = await guild.members.fetch(data.user.id)
                let logsEmbed   = this.utils.embed.embed().setTitle("🔇 Re mute de " + mutedMember.user.username)
                    .setColor('#4886f0')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedMember.user.id + "/" + mutedMember.user.avatar + ".png")
                    .addField("Le vilain", "<@!" + mutedMember.user.id + ">", true)
                    .addField("La sanction a été prononcé par", "<@!" + user[0].muterId + ">", true)
                    .addField("Raison", user[0].muteReason)
                    .addField("Date Unmute", (new Date(user[0].unmuteDate)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

                await mutedMember.roles.add(muteRole)
                await logsChannel.send({embeds: [logsEmbed]})
            }
        }

        this.utils.logger.log("[JoinAndLeave] " + title + data.user.username + "#" + data.user.discriminator)

        await this.clients.mongo.insert("historical", {
            "type"      : add ? "join" : "leave",
            "userId"    : data.user.id,
            "date"      : (new Date()).getTime(),
        })

        let embed = this.utils.embed.embed().setTitle(title + data.user.username)
            .setColor(color)
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField(message, "<@!" + data.user.id + ">")

        channel.send({embeds: [embed]})
    }
}

module.exports = JoinAndLeave;