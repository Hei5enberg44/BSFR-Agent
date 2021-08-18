class PingCommand {
    name = "ping"
    description = "Test si le bot fonctionne."

    async run(interaction) {
        await interaction.reply({content: "Pong!", ephemeral: true});
    }
}

module.exports = PingCommand;