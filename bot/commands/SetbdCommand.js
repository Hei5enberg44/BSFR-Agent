const { isValid } = require("../functions/Date.js")

class SetbdCommand {
    name = "setbd"
    description = "Assigne une date d'anniversaire."
    options = {
        "date": {
            "name": "date",
            "type": "string",
            "description": "Ta date d'anniversaire au format JJ/MM/AAAA (ex: 11/06/2000)",
            "required": true
        },
    }
    channels = []

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async run(interaction) {
        if(this.config.ids.channels.setbirthday !== interaction.channelId) {
            this.utils.logger.log("[SetbdCommand] Command executed in the wrong channel")
            return interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.setbirthday + ">", ephemeral: true});
        }

        let date = interaction.options._hoistedOptions[0].value

        // If date isn't valid
        if(!isValid(date)) {
            this.utils.logger.log("[SetbdCommand] Invalid date: " + date)
            return interaction.reply({content: "Date invalide", ephemeral: true});
        }

        if(parseInt(date.split("/")[2]) > new Date().getFullYear()) {
            this.utils.logger.log("[SetbdCommand] Birth date can't be higher than " + new Date().getFullYear() + ": " + date.split("/")[2])
            return interaction.reply({content: "L'année de naissance ne doit pas être supérieur à " + new Date().getFullYear() + ".", ephemeral: true});
        }

        const mongoUpdated = await this.clients.mongo.insertOrUpdate("users", { discordId: interaction.user.id }, {
            "birthday": interaction.options._hoistedOptions[0].value
        })

        await this.clients.mongo.insert("historical", {
            "type"      : "setBirthday",
            "userId"    : interaction.user.id,
            "birthday"  : interaction.options._hoistedOptions[0].value,
            "date"      : (new Date()).getTime()
        })

        if(mongoUpdated) {
            this.utils.logger.log("[SetbdCommand] Birth date has been saved")
            return interaction.reply({content: "La date de naissance a bien été enregistrée.", ephemeral: true});
        }

        this.utils.logger.log("[SetbdCommand] Birth date hasn't been saved")
        return interaction.reply({content: "La date de naissance n'a pas pu être enregistrée.", ephemeral: true});
    }
}

module.exports = SetbdCommand;