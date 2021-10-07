class PingCommand {
    name        = "ping"
    description = "Test si le bot fonctionne."
    channels    = []

    constructor(opt) {
        this.utils = opt.utils
    }

    async run(interaction) {
        this.utils.logger.log("[PingCommand] Ping... Pong!")
        await interaction.reply({content: "Pong!", ephemeral: true});
    }
}

module.exports = PingCommand;