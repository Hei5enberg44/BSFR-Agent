class SetbdCommand {
    name = "setbd"
    description = "Assigne une date d'anniversaire."
    options = {
        "date": {
            "type": "string",
            "description": "Ta date d'anniversaire au format JJ-MM-AAAA (ex: 11-06-2000)",
            "required": true
        },
    }

    constructor(opt) {
        this.clients = opt.clients
    }

    async run(interaction) {
        await this.clients.redis.setJsonEntries(interaction.user.id, {
            "birthday": interaction.options._hoistedOptions[0].value
        })
    }
}

module.exports = SetbdCommand;