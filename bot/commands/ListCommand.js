const { getAllBannedWord } = require("../functions/BannedWords");
const { getAllBirthdayMessage } = require("../functions/BirthdayMessage");

class ListCommand {
    name = "list"
    description = "Liste"
    options = {
        "subject": {
            "name": "sujet",
            "type": "string",
            "description": "Sujet",
            "required": true,
            "choices": [
                { displayName: "Mots à bannir", name: "bannedWord" },
                { displayName: "Messages d'anniversaire", name: "birthdayMessage" }
            ]
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
    }

    async run(interaction) {
        const subject = interaction.options._hoistedOptions[0].value

        let embed = this.utils.embed.embed().setColor('#f07848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")

        switch (subject) {
            case "bannedWord":
                let bannedWords = await getAllBannedWord(interaction.user, this)

                await embed.setTitle("📒 Liste des mots bannis")
                    .addField("Mots", bannedWords.map((bannedWord, index) => {return index + " - " + bannedWord.word}).join("\n"))

                return interaction.reply({embeds: [embed]})
            case "birthdayMessage":
                let birthdayMessages = await getAllBirthdayMessage(interaction.user, this)

                await embed.setTitle("📒 Liste des phrases d'anniversaire")
                    .addField("Mots", birthdayMessages.map((birthdayMessage, index) => {return index + " - " + birthdayMessage.message}).join("\n"))

                return interaction.reply({embeds: [embed]})
            default:
                return interaction.reply({content: "Le sujet n'est pas valide.", ephemeral: true})
        }
    }
}

module.exports = ListCommand;