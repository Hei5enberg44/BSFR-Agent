async function addBannedWord(words, user, opt) {
    words = words.replace(" ", "").split(";")
    let response = []

    for (const index in words) {
        opt.utils.logger.log("[BannedWords] " + user.tag + " try to add a new banned word: " + words[index])

        const isRegistered = await opt.clients.mongo.find("bannedWords",{"word": words[index].toLowerCase()})
        let result = ""

        // Check if the word is already registered
        if(isRegistered.length > 0) {
            result = "Déjà_ajouté"

            await opt.clients.mongo.insert("historical", {
                "type"      : "addBannedWord",
                "userId"    : user.id,
                "word"      : words[index].toLowerCase(),
                "result"    : "alreadyAdded",
                "date"      : (new Date()).getTime()
            })

            opt.utils.logger.log("[BannedWords] " + words[index] + " already exist in database")
        } else {
            const mongoUpdated = await opt.clients.mongo.insert("bannedWords",  {
                "word"      : words[index].toLowerCase(),
                "userId"    : user.id,
                "date"      : (new Date()).getTime()
            })

            // If the word has been saved in database
            if(mongoUpdated) {
                result = "Ajouté"

                await opt.clients.mongo.insert("historical", {
                    "type"      : "addBannedWord",
                    "userId"    : user.id,
                    "word"      : words[index].toLowerCase(),
                    "result"    : "added",
                    "date"      : (new Date()).getTime()
                })

                opt.utils.logger.log("[BannedWords] " + user.tag + " added a new banned word: " + words[index])
            } else {
                result = "Échec"

                await opt.clients.mongo.insert("historical", {
                    "type"      : "addBannedWord",
                    "userId"    : user.id,
                    "word"      : words[index].toLowerCase(),
                    "result"    : "failed",
                    "date"      : (new Date()).getTime()
                })

                opt.utils.logger.log("[BannedWords] " + user.tag + " failed to add a new banned word: " + words[index])
            }
        }

        if(response[result])
            response[result] += ", " + words[index]
        else
            response[result] = words[index]
    }

    return response
}

async function getAllBannedWord(user, opt) {
    await opt.clients.mongo.insert("historical", {
        "type"      : "getAllBannedWord",
        "userId"    : user.id,
        "date"      : (new Date()).getTime()
    })

    opt.utils.logger.log("[BannedWords] " + user.tag + " get all banned words")

    return opt.clients.mongo.find("bannedWords",{})
}

module.exports = { addBannedWord, getAllBannedWord }