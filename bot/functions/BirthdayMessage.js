async function addBirthdayMessage(message, user, opt) {
    opt.utils.logger.log("[BirthdayMessage] " + user.tag + " try to add a new birthday message: " + message)

    const isRegistered = await opt.clients.mongo.find("birthdayMessages",{"message": message})

    // Check if the sentence is already registered
    if(isRegistered.length > 0) {
        await opt.clients.mongo.insert("historical", {
            "type"      : "addBirthdayMessage",
            "userId"    : user.id,
            "message"   : message,
            "result"    : "alreadyAdded",
            "date"      : (new Date()).getTime()
        })

        opt.utils.logger.log("[BirthdayMessage] " + message + " already exist in database")

        return "Déjà ajouté"
    } else {
        const mongoUpdated = await opt.clients.mongo.insert("birthdayMessages",  {
            "message"   : message,
            "userId"    : user.id,
            "date"      : (new Date()).getTime()
        })

        // If the sentence has been saved in database
        if(mongoUpdated) {
            await opt.clients.mongo.insert("historical", {
                "type"      : "addBirthdayMessage",
                "userId"    : user.id,
                "message"   : message,
                "result"    : "added",
                "date"      : (new Date()).getTime()
            })

            opt.utils.logger.log("[BirthdayMessage] " + user.tag + " added a new birthday message: " + message)

            return "Ajouté"
        } else {
            await opt.clients.mongo.insert("historical", {
                "type"      : "addBirthdayMessage",
                "userId"    : user.id,
                "message"   : message,
                "result"    : "failed",
                "date"      : (new Date()).getTime()
            })

            opt.utils.logger.log("[BannedWords] " + user.tag + " failed to add a new birthday message: " + message)

            return "Échec"
        }
    }
}

async function getAllBirthdayMessage(user, opt) {
    await opt.clients.mongo.insert("historical", {
        "type"      : "getAllBirthdayMessages",
        "userId"    : user.id,
        "date"      : (new Date()).getTime()
    })

    opt.utils.logger.log("[BirthdayMessages] " + user.tag + " get all banned words")

    return opt.clients.mongo.find("birthdayMessages",{})
}

module.exports = { addBirthdayMessage, getAllBirthdayMessage }