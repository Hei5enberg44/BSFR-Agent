const { addBannedWord } = require("../functions/BannedWords");
const { addBirthdayMessage } = require("../functions/BirthdayMessage");

class AddCommand {
    name = "add"
    description = "Ajout"
    options = {
        "subject": {
            "name": "sujet",
            "type": "string",
            "description": "Sujet",
            "required": true,
            "choices": [
                { displayName: "Mots à bannir", name: "bannedWord" },
                { displayName: "Message d'anniversaire", name: "birthdayMessage" }
            ]
        },
        "message": {
            "name": "texte",
            "type": "string",
            "description": "/!\\ Pour les mots à bannir, merci de les séparer par une virgule /!\\",
            "required": true
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
    }

    async run(interaction) {
        const subject = interaction.options._hoistedOptions[0].value

        switch (subject) {
            case "bannedWord":
                let results = await addBannedWord(interaction.options._hoistedOptions[1].value, interaction.user, this)
                let bannedWordEmbed = this.utils.embed.embed().setTitle("⛔ Ajout de mots bannis")
                    .setColor('#F04848')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")
                    .addField("Utilisateur", interaction.user.tag)

                for (const index in results) {
                    await bannedWordEmbed.addField(index.replace("_", " "), results[index])
                }

                return interaction.reply({embeds: [bannedWordEmbed]})
            case "birthdayMessage":
                let result = await addBirthdayMessage(interaction.options._hoistedOptions[1].value, interaction.user, this)
                let birthdayMessageEmbed = this.utils.embed.embed().setTitle("🥳 Ajout d'une phrase d'anniversaire")
                    .setColor('#48f050')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")
                    .addField("Utilisateur", interaction.user.tag)
                    .addField(result, interaction.options._hoistedOptions[1].value)

                return interaction.reply({embeds: [birthdayMessageEmbed]})
            default:
                return interaction.reply({content: "Le sujet n'est pas valide.", ephemeral: true})
        }
    }
}

module.exports = AddCommand;