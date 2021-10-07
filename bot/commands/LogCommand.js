const fs = require('fs')
const { MessageAttachment } = require("discord.js")
const { isValid } = require("../functions/Date.js")

class LogCommand {
    name        = "log"
    description = "Récupère un fichier de log."
    options     = {
        "date": {
            "name"          : "date",
            "type"          : "string",
            "description"   : "Date du fichier de log demandé au format JJ/MM/AAAA (ex: 11/06/2000)",
            "required"      : false
        },
    }
    roles       = ["Admin", "Modérateur"]
    channels    = ["logs"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        let rawDate = new Date()
        let date = rawDate.getFullYear() + '-' + ("0" + (rawDate.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + rawDate.getDate()).slice(-2)

        // Check if the submitted date is valid
        if(interaction.options._hoistedOptions.length !== 0) {
            let wantedDate = interaction.options._hoistedOptions[0].value

            if(!isValid(wantedDate)) {
                this.utils.logger.log("[LogCommand] Invalid date: " + wantedDate)
                return interaction.reply({content: "Date invalide", ephemeral: true});
            }

            let splitedDate = wantedDate.split("/")
            date = splitedDate[2] + "-" + splitedDate[1] + "-" + splitedDate[0]
        }

        this.utils.logger.log("[LogCommand] Selected date: " + date)

        let path = "logs/" + date + ".log"
        let self = this

        return fs.access(path, fs.F_OK, async function (error) {
            if(error) {
                self.utils.logger.log("[LogCommand] Log doesn't exist")
                return interaction.reply({content: "Le fichier demandé n'existe pas.", ephemeral: false});
            }

            self.utils.logger.log("[LogCommand] Log found")

            await self.clients.mongo.insert("historical", {
                "type"      : "getLog",
                "userId"    : interaction.user.id,
                "file"      : date + ".log",
                "date"      : (new Date()).getTime()
            })

            let attachment = new MessageAttachment(path, date + ".log")

            return interaction.reply({files: [attachment]});
        })
    }
}

module.exports = LogCommand;