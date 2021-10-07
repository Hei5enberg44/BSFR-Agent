// Function to unban a member
async function unban(opt) {
    const usersToUnban = await opt.clients.mongo.find("users", { unbanDate: {$lt: (new Date()).getTime()} }, false)

    for(const [, userToUnban] of usersToUnban.entries()) {
        const bannedUser = await opt.clients.discord.getClient().users.fetch(userToUnban.discordId)

        // Try to send a dm to tell the member that he is unban. If we can't, we will send a message to tell the mods that they have to manually reinvite him.
        try {
            await bannedUser.send({content: "**[BSFR]**\n\nTu as été débanni.\nTâche d'être plus sage à l'avenir.\n\nVoici le lien d'invitation du serveur : " + opt.config.links.discordInvite})
        } catch (e) {
            const moderationChannel = opt.guild.channels.resolve(opt.config.ids.channels.moderation)

            moderationChannel.send({content: "<@&" + opt.config.ids.roles.moderator + "> - **Déban de** <@!" + bannedUser.id + ">\n\nImpossible d'envoyer le lien d'invitation automatiquement.\nMerci de réinviter l'utilisateur manuellement.\n\nLien d'invitation : " + opt.config.links.discordInvite})
        }

        opt.utils.logger.log("[AutoUnban] Unbanning " + bannedUser.tag)

        await opt.guild.members.unban(bannedUser.id)

        const mongoUpdated = await opt.clients.mongo.update("users", { "_id": userToUnban._id }, {
            $unset: {
                "bannerId"  : 1,
                "reason"    : 1,
                "unbanDate" : 1
            }
        })

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

module.exports = { unban }