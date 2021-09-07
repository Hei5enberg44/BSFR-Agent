class AddbdmessageCommand {
    name = "addbdmessages"
    description = "Ajout d'une phrase pour les anniversaires"
    options = {
        "message": {
            "name": "message",
            "type": "string",
            "description": "Message",
            "required": true
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
    }

    async run(interaction) {
        let message = interaction.options._hoistedOptions[0].value

        const mongoUpdated = await this.clients.mongo.insert("birthdayMessages",  {
            "message"   : message,
            "userId"    : interaction.user.id,
            "date"      : (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
        })

        if(mongoUpdated) {
            this.utils.logger.log("[AddbdmessageCommand] " + interaction.user.username + " added a new birthday messages: " + message)
            return interaction.reply({content: "Le message d'anniversaire a bien été enregistré", ephemeral: true});
        } else {
            this.utils.logger.log("[AddbdmessageCommand] " + interaction.user.username + " failed to add a new birthday messages: " + message)
            return interaction.reply({content: "Le message d'anniversaire n'a pas pu être enregistré", ephemeral: true});
        }
    }
}

module.exports = AddbdmessageCommand;