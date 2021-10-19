class SetGoogleCodeCommand {
    name        = "setgooglecode"
    description = "Authentifier l'agent au compte Google BSFR."
    options     = {
        "code": {
            "name"          : "code",
            "type"          : "string",
            "description"   : "Code d'authentification",
            "required"      : true
        }
    }
    roles       = ["Admin"]
    channels    = ["admin"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
        this.guild      = opt.guild
    }

    async run(interaction) {
        const code = interaction.options._hoistedOptions[0].value

        this.utils.logger.log('[SetGoogleCodeCommand] Setting code: ' + code)

        const saved = await this.clients.google.authorize(2, code)

        if(saved)
            return interaction.reply({content: "Authentification Google réussie."})
        else
            return interaction.reply({content: "Erreur lors de l'authentification Google."})
    }
}

module.exports = SetGoogleCodeCommand;