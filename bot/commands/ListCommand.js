const { getAllBannedWord } = require("../functions/BannedWords");
const { getAllBirthdayMessage } = require("../functions/BirthdayMessage");

class ListCommand {
    name        = "list"
    description = "Liste diverse"
    options     = {
        "subject": {
            "name"          : "sujet",
            "type"          : "string",
            "description"   : "Sujet",
            "required"      : true,
            "choices"       : [
                { displayName: "Mots à bannir", name: "bannedWord" },
                { displayName: "Messages d'anniversaire", name: "birthdayMessage" }
            ]
        }
    }
    roles = ["Admin", "Modérateur"]
    channels = ["agentCommands"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
        this.config     = opt.config
    }

    async run(interaction) {
        const subject = interaction.options._hoistedOptions[0].value

        this.utils.logger.log("[ListCommand] Subject selected: " + subject)

        let embed = this.utils.embed.embed().setColor('#f07848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")

        switch (subject) {
            case "bannedWord":
                const bannedWords = await getAllBannedWord(interaction.user, this)

                await embed.setTitle("📒 Liste des mots bannis")
                    .addField("Mots", bannedWords.length > 0 ? bannedWords.map((bannedWord, index) => {return index + " - " + bannedWord.word}).join("\n") : "Aucun mot banni")

                break
            case "birthdayMessage":
                const birthdayMessages = await getAllBirthdayMessage(interaction.user, this)

                await embed.setTitle("📒 Liste des phrases d'anniversaire")
                    .addField("Mots", birthdayMessages.length > 0 ? birthdayMessages.map((birthdayMessage, index) => {return index + " - " + birthdayMessage.message}).join("\n") : "Aucune phrase d'anniversaire")

                break
        }

        return interaction.reply({embeds: [embed]})
    }
}

module.exports = ListCommand;