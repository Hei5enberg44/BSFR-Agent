class AddbannedwordCommand {
    name = "addbannedword"
    description = "Ajout d'une mot interdit"
    options = {
        "word": {
            "name": "mot",
            "type": "string",
            "description": "Mot",
            "required": true
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
    }

    async run(interaction) {
        let word = interaction.options._hoistedOptions[0].value

        const mongoUpdated = await this.clients.mongo.insert("bannedWords",  {
            "word"      : word,
            "userId"    : interaction.user.id,
            "date"      : (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
        })

        if(mongoUpdated) {
            this.utils.logger.log("[AddbannedwordCommand] " + interaction.user.username + " added a new banned word: " + word)
            return interaction.reply({content: "Le mot interdit a bien été enregistré", ephemeral: true});
        } else {
            this.utils.logger.log("[AddbannedwordCommand] " + interaction.user.username + " failed to add a new banned word: " + word)
            return interaction.reply({content: "Le mot interdit n'a pas pu être enregistré", ephemeral: true});
        }
    }
}

module.exports = AddbannedwordCommand;