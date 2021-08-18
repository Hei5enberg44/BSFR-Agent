class SetbdCommand {
    name = "setbd"
    description = "Assigne une date d'anniversaire."
    options = {
        "date": {
            "type": "string",
            "description": "Ta date d'anniversaire au format JJ-MM-AAAA (ex: 11-06-2000)",
            "required": true
        }
    }
}

module.exports = SetbdCommand;