class ValidationBan {
    name = "ValidationBan"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.banCommand = new (require("../../bot/commands/BanCommand"))(this)
    }

    async listen(data) {
        const guild             = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const validator         = await guild.members.cache.get(data.user_id)
        const isAdmin           = validator.roles.cache.some(r=>["admin", "Admin"].includes(r.name));


        if(isAdmin && data.channel_id === this.config.ids.channels.admin) {
            const userToBan         = (await this.clients.mongo.find("pendings", { pendingBanMessageId: data.message_id }))[0]
            const vilain            = await guild.members.cache.get(userToBan.bannedId)
            const banner            = await guild.members.cache.get(userToBan.bannerId)
            const muteRole          = await guild.roles.cache.get(this.config.ids.roles.muted)
            const logsChannel       = await guild.channels.cache.get(this.config.ids.channels.logs)
            const pendingMessage    = await guild.channels.cache.get(this.config.ids.channels.admin).messages.fetch(userToBan.pendingBanMessageId);

            let logPending = "[ValidationBan] Pending ban for " + vilain.user.tag + " asked by " + banner.user.tag + " has been"

            let logsEmbedMessage = this.utils.embed.embed()
            await logsEmbedMessage.setColor('#f07848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + vilain.user.id + "/" + vilain.user.avatar + ".png")
                .addField("Le vilain", "<@!" + vilain.user.id + ">")
                .addField("La sanction a été demandée par", "<@!" + userToBan.bannerId + ">", true)

            let type = ""

            if(data.emoji.name === "❌") {
                type = "refusedBan"
                logPending += " refused by " + validator.user.tag
                await logsEmbedMessage.setTitle("🔨 [REFUSÉE] Demande de ban de " + vilain.user.username)
                    .addField("La demande a été refusée par", "<@!" + data.user_id + ">", true)

                await vilain.roles.remove(muteRole)

                try {
                    await vilain.send({content: "\n**[BSFR]**\n\nLa demande de bannissement n'a pas été approuvée.\nTu es désormais démuté."})
                } catch (e) {
                    this.utils.logger.log("[ValidationBan] Can't send message to " + vilain.user.tag)
                }
            } else if(data.emoji.name === "✅") {
                type = "acceptedBan"
                logPending += " accepted by " + validator.user.tag
                await logsEmbedMessage.setTitle("🔨 [ACCEPTÉE] Demande de ban de " + vilain.user.username)
                    .addField("La demande a été acceptée par", "<@!" + data.user_id + ">", true)

                await this.banCommand.ban(guild, userToBan.bannedId, userToBan.banReason, userToBan.bannerId, new Date(userToBan.unbanDate), false)
            }

            if(["❌", "✅"].includes(data.emoji.name)) {
                this.utils.logger.log(logPending)

                await logsEmbedMessage.addField("Raison", userToBan.banReason)
                    .addField("Date de débanissement", (new Date(userToBan.unbanDate)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

                await logsChannel.send({embeds: [logsEmbedMessage]})
                await pendingMessage.delete()

                const mongoUpdated = await this.clients.mongo.update("users", {"_id": userToBan._id}, {
                    $unset: {
                        "pendingBanMessageId": 1,
                        "bannerId": 1,
                        "banReason": 1,
                        "unbanDate": 1
                    }
                })

                await this.clients.mongo.insert("historical", {
                    "type"          : type,
                    "bannerId"      : userToBan.bannerId,
                    "userId"        : userToBan.bannedId,
                    "validatorId"   : validator.user.id,
                    "reason"        : userToBan.banReason,
                    "unbanDate"     : userToBan.unbanDate,
                    "date"          : (new Date()).getTime()
                })

                await this.clients.mongo.remove("pendings", {pendingBanMessageId: data.message_id})

                if (mongoUpdated)
                    this.utils.logger.log("[ValidationBan] Saved")
                else
                    this.utils.logger.log("[ValidationBan] Can't save it")
            }
        }
    }
}

module.exports = ValidationBan;