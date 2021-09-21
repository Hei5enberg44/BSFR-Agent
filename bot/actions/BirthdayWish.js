async function wish(opt) {
    const client                = opt.clients.discord.getClient()
    const guild                 = client.guilds.cache.get(opt.config.discord.guildId)
    const birthdayWishChannel   = guild.channels.resolve(opt.config.ids.channels.birthdayWish)

    let date = (new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
    date = date.substr(0, 5)

    const birthdayUsers     = await opt.clients.mongo.find("users", { birthday: {$regex: date}})
    const birthdayMessages  = await opt.clients.mongo.find("birthdayMessages", {})

    for(const [, birthdayUser] of birthdayUsers.entries()) {
        const user = await client.users.cache.get(birthdayUser.discordId)

        opt.utils.logger.log("[BirthdayWish] Happy Birthday to " + user.username + "#" + user.discriminator)

        const random = Math.floor(Math.random() * birthdayMessages.length)
        birthdayWishChannel.send(birthdayMessages[random].message + " <@!" + birthdayUser.discordId + ">")
    }
}

module.exports = { wish }