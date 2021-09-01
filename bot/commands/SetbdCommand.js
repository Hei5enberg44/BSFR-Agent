class SetbdCommand {
    name = "setbd"
    description = "Assigne une date d'anniversaire."
    options = {
        "date": {
            "type": "string",
            "description": "Ta date d'anniversaire au format JJ-MM-AAAA (ex: 11/06/2000)",
            "required": true
        },
    }

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
    }

    async run(interaction) {
        if(this.config.ids.channels.setbirthday !== interaction.channelId)
            return await interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.setbirthday + ">", ephemeral: true});

        let regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')
        let date = interaction.options._hoistedOptions[0].value

        if(!regex.test(date))
            return await interaction.reply({content: "Date invalide", ephemeral: true});

        if(parseInt(date.split("-")[2]) < 1900 || parseInt(date.split("-")[2]) > new Date().getFullYear())
            return await interaction.reply({content: "L'année de naissance doit être comprise entre 1900 et " + new Date().getFullYear(), ephemeral: true});

        const redisUpdated = await this.clients.redis.setJsonEntries(interaction.user.id, {
            "birthday": interaction.options._hoistedOptions[0].value
        })

        if(redisUpdated === "OK")
            return await interaction.reply({content: "La date de naissance a bien été enregistrer", ephemeral: true});

        return await interaction.reply({content: "La date de naissance n'a pas pu être enregistrer.", ephemeral: true});
    }
}

module.exports = SetbdCommand;