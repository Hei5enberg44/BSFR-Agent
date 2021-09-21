async function unban(opt) {
    const client = opt.clients.discord.getClient()
    const guild = client.guilds.cache.get(opt.config.discord.guildId)
    const moderationChannel = guild.channels.resolve(opt.config.ids.channels.moderation)

    const usersToUnban = await opt.clients.mongo.find("users", { unbanDate: {$lt: (new Date()).getTime()} }, false)

    if(usersToUnban.length !== 0) {
        for(const [, userToUnban] of usersToUnban.entries()) {
            const bannedUser = await client.users.fetch(userToUnban.discordId)

            try {
                await bannedUser.send({content: "**[BSFR]**\n\nTu as été débanni.\nTâche d'être plus sâge à l'avenir\n\nVoici le lien d'invitation du serveur:" + opt.config.links.discordInvite})
            } catch (e) {
                moderationChannel.send({content: "<@&" + opt.config.ids.roles.moderator + "> - **Déban de** <@!" + bannedUser.id + ">\n\nImpossible d'envoyer le lien d'invitation automatiquement.\nMerci de réinviter l'utilisateur.\n\nLien d'invitation: " + opt.config.links.discordInvite})
            }

            opt.utils.logger.log("[AutoUnban] Unbanning " + bannedUser.tag)
            await guild.members.unban(bannedUser.id)
            const mongoUpdated = await opt.clients.mongo.update("users", { "_id": userToUnban._id }, { $unset: {
                    "bannerId"  : 1,
                    "reason"    : 1,
                    "unbanDate" : 1
            }})

            await opt.clients.mongo.insert("historical", {
                "type"      : "unban",
                "userId"    : userToUnban.discordId,
                "date"      : userToUnban.unbanDate,
                "reason"    : userToUnban.reason,
                "bannerId"  : userToUnban.bannerId
            })

            if(mongoUpdated)
                opt.utils.logger.log("[AutoUnban] Saved")
            else
                opt.utils.logger.log("[AutoUnban] An error occured while updating users in MongoDB")
        }
    }
}

module.exports = { unban }