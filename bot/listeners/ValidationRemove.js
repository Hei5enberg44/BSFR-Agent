class ValidationRemove {
    name = "ValidationRemove"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        const logsChannel   = this.guild.channels.cache.get(this.config.ids.channels.logs)
        const remove        = (await this.clients.mongo.find("pendings", { type: "remove", messageId: data.message_id }))

        // If the reaction concern a pending remove and the user who react is not the bot
        if(remove.length > 0 && data.user_id !== this.config.discord.clientId) {
            const pendingMessage = await this.guild.channels.cache.get(remove[0].channelId).messages.fetch(remove[0].messageId);
            const member         = await this.guild.members.cache.get(data.user_id)

            let title = null

            switch (remove[0].subType) {
                case "bannedWords":
                    title = "mots bannis"
                    break;
                case "brithdayMessages":
                    title = "messages d'anniversaire"
                    break;
            }

            if(data.emoji.name === "❌") {
                await this.clients.mongo.insert("historical", {
                    "type": "refusedRemove",
                    "subType": remove[0].subType,
                    "userId": member.user.id,
                    "dataWantedToBeRemoved": remove[0].removed,
                    "date": (new Date()).getTime()
                })

                title = "🗑️ Refus de Suppression de " + title
            }

            if(data.emoji.name === "✅") {
                // Remove every selected id from database
                for(const [, idToRemove] of remove[0].ids.entries()) {
                    await this.clients.mongo.remove(remove[0].subType, {"_id": idToRemove})
                }

                await this.clients.mongo.insert("historical", {
                    "type": "remove",
                    "subType": remove[0].subType,
                    "userId": member.user.id,
                    "removed": remove[0].removed,
                    "date": (new Date()).getTime()
                })

                title = "🗑️ Suppression de " + title
            }

            if(["❌", "✅"].includes(data.emoji.name)) {
                const embed = this.utils.embed.embed().setTitle(title)
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true, size: 1024}))
                    .addField("Données", remove[0].removed.join("\n"))

                await logsChannel.send({embeds: [embed]})
                await this.clients.mongo.remove("pendings", {_id: remove[0]._id})
                await pendingMessage.delete()
            }
        }
    }
}

module.exports = ValidationRemove;