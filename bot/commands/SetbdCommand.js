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
        this.clients = opt.clients
    }

    async run(interaction) {
        let regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')

        if(!regex.test(interaction.options._hoistedOptions[0].value)) {
            await interaction.reply({content: "Date invalide", ephemeral: true});
            return 0;
        }

        const redisUpdated = await this.clients.redis.setJsonEntries(interaction.user.id, {
            "birthday": interaction.options._hoistedOptions[0].value
        })
    }
}

module.exports = SetbdCommand;