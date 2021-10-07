// Function to unmute a member
async function unmute(opt) {
    const muteRole      = opt.guild.roles.cache.get(opt.config.ids.roles.muted)
    const logsChannel   = opt.guild.channels.cache.get(opt.config.ids.channels.logs)

    const usersToUnmute = await opt.clients.mongo.find("users", { unmuteDate: {$lt: (new Date()).getTime()} }, false)

    for(const [, userToUnmute] of usersToUnmute.entries()) {
        let mutedMember = null

        // Try to get the muted user in case if he leaves the discord server
        try {
            mutedMember = await opt.guild.members.cache.get(userToUnmute.discordId)
        } catch (e) {
            opt.utils.logger.log("[Unmute] User is not on the discord server.")

            await opt.clients.mongo.update("users", { "_id": userToUnmute._id }, {
                $unset: {
                    "unmuteDate"    : 1,
                    "muteReason"    : 1,
                    "muterId"       : 1
                }
            })

            await opt.clients.mongo.insert("historical", {
                "type"      : "autoUnmute",
                "userId"    : userToUnmute.discordId,
                "date"      : userToUnmute.unmuteDate,
                "reason"    : userToUnmute.muteReason,
                "muterId"   : userToUnmute.muterId
            })

            let logsMessage = opt.utils.embed.embed().setTitle("🔇 Unmute de " + userToUnmute.discordId)
                .setDescription("L'utilisateur n'est plus présent sur le discord")
                .setColor('#1b427c')
                .addField("Le vilain", "<@!" + userToUnmute.discordId + ">", true)
                .addField("La sanction avait été prononcée par", "<@!" + userToUnmute.muterId + ">", true)
                .addField("Raison", userToUnmute.muteReason)

            await logsChannel.send({embeds: [logsMessage]})
        }

        if(mutedMember) {
            // Try to send a dm to tell the member that he is unmute
            try {
                await mutedMember.send({content: "**[BSFR]**\n\nTu as été démuté."})
            } catch (e) {
                opt.utils.logger.log("[Unmute] Message can't be sent to user")
            }

            opt.utils.logger.log("[AutoUnban] Unmutting " + mutedMember.user.tag)

            await mutedMember.roles.remove(muteRole)

            let logsMessage = opt.utils.embed.embed().setTitle("🔇 Unmute de " + mutedMember.user.username)
                .setColor('#1b427c')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedMember.user.id + "/" + mutedMember.user.avatar + ".png")
                .addField("Le vilain", "<@!" + mutedMember.user.id + ">", true)
                .addField("La sanction avait été prononcée par", "<@!" + userToUnmute.muterId + ">", true)
                .addField("Raison", userToUnmute.muteReason)

            await logsChannel.send({embeds: [logsMessage]})

            const mongoUpdated = await opt.clients.mongo.update("users", { "_id": userToUnmute._id }, {
                $unset: {
                    "unmuteDate"    : 1,
                    "muteReason"    : 1,
                    "muterId"       : 1
                }
            })

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