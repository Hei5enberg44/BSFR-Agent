const crypto = require('crypto');

// Function to wish a birthday
async function wish(opt) {
    const birthdayWishChannel = opt.guild.channels.resolve(opt.config.ids.channels.birthdayWish)

    // Creating date in format JJ/MM/YYYY and removing the year
    let date = ((new Date()).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })).substr(0, 5)

    const birthdayMessages  = await opt.clients.mongo.find("birthdayMessages", {})
    const birthdayUsers     = await opt.clients.mongo.find("users", { birthday: {$regex: date}})

    for(const [, birthdayUser] of birthdayUsers.entries()) {
        const member = await opt.guild.members.cache.get(birthdayUser.discordId)

        // Generating a new random number, if there is only one birthday messages, random variable will be equal to 0
        const random = crypto.randomInt(birthdayMessages.length)

        opt.utils.logger.log("[BirthdayWish] Happy Birthday to " + member.user.tag)

        birthdayWishChannel.send(birthdayMessages[random].message + " <@!" + member.user.id + ">")
    }
}

module.exports = { wish }