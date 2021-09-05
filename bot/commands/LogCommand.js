const fs = require('fs')
const { MessageAttachment } = require("discord.js")

class LogCommand {
    name = "log"
    description = "Récupère un fichier de log."
    options = {
        "date": {
            "name": "date",
            "type": "string",
            "description": "Date du fichier de log demander au format JJ/MM/AAAA (ex: 11/06/2000)",
            "required": false
        },
    }
    roles = ["Admin"]

    constructor(opt) {
        this.utils  = opt.utils
        this.config = opt.config
    }

    async run(interaction) {
        if(this.config.ids.channels.logs !== interaction.channelId) {
            this.utils.logger.log("[LogCommand] Command executed in the wrong channel")
            return interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.logs + ">", ephemeral: true});
        }

        let rawDate = new Date()
        let date = rawDate.getFullYear() + '-' + ("0" + (rawDate.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + rawDate.getDate()).slice(-2)

        if(interaction.options._hoistedOptions.length !== 0) {
            let regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')
            let wantedDate = interaction.options._hoistedOptions[0].value

            if(!regex.test(wantedDate)) {
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
                return interaction.reply({content: "Le fichier demander n'existe pas.", ephemeral: false});
            }

            self.utils.logger.log("[LogCommand] Log found")

            let attachment = new MessageAttachment(path, date + ".log")

            return interaction.reply({files: [attachment], ephemeral: false});
        })
    }
}

module.exports = LogCommand;