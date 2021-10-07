class SendCommand {
    name        = "send"
    description = "Envoie un message dans un channel."
    options     = {
        "channel": {
            "name"          : "channel",
            "type"          : "channel",
            "description"   : "Channel",
            "required"      : true
        },
        "message": {
            "name"          : "message",
            "type"          : "string",
            "description"   : "Message",
            "required"      : true
        }
    }
    roles       = ["Admin", "Modérateur"]
    channels    = []

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
        this.guild      = opt.guild
    }

    async run(interaction) {
        const targetChannel = interaction.options._hoistedOptions[0].channel
        const message       = interaction.options._hoistedOptions[1].value

        if(targetChannel.type === "GUILD_CATEGORY") {
            this.utils.logger.log("[SendCommand] Channel selected is not a channel")
            return interaction.reply({content: "Merci de sélectionner un channel correct.", ephemeral: true});
        }

        this.utils.logger.log('[SendCommand] Sending message from ' + interaction.user.tag + " in channel " + targetChannel.name)

        const logsChannel   = this.guild.channels.cache.get(this.config.ids.channels.logs)

        let logsEmbed = this.utils.embed.embed().setTitle("✍️ Envoi de message")
            .setColor('#47EF66')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")
            .addField("Par", "<@!" + interaction.user.id + ">", true)
            .addField("Channel", "<#" + targetChannel.id + ">", true)
            .addField("Message", message)

        logsChannel.send({embeds: [logsEmbed]})
        targetChannel.send(message)

        this.utils.logger.log('[SendCommand] Message sent')

        return interaction.reply({content: "Le message a bien été envoyé.", ephemeral: true})
    }
}

module.exports = SendCommand;