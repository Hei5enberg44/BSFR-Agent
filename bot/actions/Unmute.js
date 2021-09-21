async function unmute(opt) {
    const client        = opt.clients.discord.getClient()
    const guild         = client.guilds.cache.get(opt.config.discord.guildId)
    const muteRole      = guild.roles.cache.get(opt.config.ids.roles.muted)
    const logsChannel   = guild.channels.cache.get(opt.config.ids.channels.logs)

    const usersToUnmute = await opt.clients.mongo.find("users", { unmuteDate: {$lt: (new Date()).getTime()} }, false)

    for(const [, userToUnmute] of usersToUnmute.entries()) {
        let mutedUser = null

        try {
            mutedUser = await guild.members.fetch(userToUnmute.discordId)
        } catch (e) {
            await opt.clients.mongo.update("users", { "_id": userToUnmute._id }, { $unset: {
                    "unmuteDate"    : 1,
                    "muteReason"    : 1,
                    "muterId"       : 1
            }})

            await opt.clients.mongo.insert("historical", {
                "type"      : "autoUnmute",
                "userId"    : userToUnmute.discordId,
                "date"      : userToUnmute.unmuteDate,
                "reason"    : userToUnmute.muteReason,
                "muterId"   : userToUnmute.muterId
            })

            opt.utils.logger.log("[Unmute] User is not on the discord server.")
        }

        if(mutedUser !== null) {
            const muterUser = await guild.members.fetch(userToUnmute.muterId)

            try {
                await mutedUser.send({content: "**[BSFR]**\n\nTu as été démuté."})
            } catch (e) {
                opt.utils.logger.log("[Unmute] Message can't be sent to user")
            }

            opt.utils.logger.log("[AutoUnban] Unmutting " + mutedUser.user.tag)
            await mutedUser.roles.remove(muteRole)

            let logsMessage = opt.utils.embed.embed().setTitle("🔇 Unmute de " + mutedUser.user.username)
                .setColor('#1b427c')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedUser.user.id + "/" + mutedUser.user.avatar + ".png")
                .addField("Le vilain", "<@!" + mutedUser.user.id + ">", true)
                .addField("La sanction avait été prononcé par", "<@!" + muterUser.user.id + ">", true)
                .addField("Raison", userToUnmute.muteReason)

            await logsChannel.send({embeds: [logsMessage]})

            const mongoUpdated = await opt.clients.mongo.update("users", { "_id": userToUnmute._id }, { $unset: {
                    "unmuteDate"    : 1,
                    "muteReason"    : 1,
                    "muterId"       : 1
                }})

            await opt.clients.mongo.insert("historical", {
                "type"      : "autoUnmute",
                "userId"    : userToUnmute.discordId,
                "date"      : userToUnmute.unmuteDate,
                "reason"    : userToUnmute.muteReason,
                "muterId"   : userToUnmute.muterId
            })

            if(mongoUpdated)
                opt.utils.logger.log("[AutoUnmute] Saved")
            else
                opt.utils.logger.log("[AutoUnmute] An error occured while updating users in MongoDB")
        }
    }
}

module.exports = { unmute }