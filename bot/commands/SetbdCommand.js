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

        let regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')
        let date = interaction.options._hoistedOptions[0].value

        if(!regex.test(date)) {
            this.utils.logger.log("[SetbdCommand] Invalid date: " + date)
            return interaction.reply({content: "Date invalide", ephemeral: true});
        }

        if(parseInt(date.split("/")[2]) < 1900 || parseInt(date.split("/")[2]) > new Date().getFullYear()) {
            this.utils.logger.log("[SetbdCommand] Birth date year is bellowed 1900 or higher than " + new Date().getFullYear() + ": " + date.split("/")[2])
            return interaction.reply({content: "L'année de naissance doit être comprise entre 1900 et " + new Date().getFullYear(), ephemeral: true});
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
            return interaction.reply({content: "La date de naissance a bien été enregistrer", ephemeral: true});
        }

        this.utils.logger.log("[SetbdCommand] Birth date hasn't been saved")
        return interaction.reply({content: "La date de naissance n'a pas pu être enregistrer.", ephemeral: true});
    }
}

module.exports = SetbdCommand;