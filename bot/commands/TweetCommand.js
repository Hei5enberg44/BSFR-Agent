class TweetCommand {
    maxLength   = 280
    name        = "tweet"
    description = "Tweete sur le compte @BeatSaberFR."
    options     = {
        "message": {
            "name"          : "texte",
            "type"          : "string",
            "description"   : "Ne pas dépasser " + this.maxLength + " caractères",
            "required"      : true
        }
    }
    roles       = ["Admin"]
    channels    = ["admin"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        const message = interaction.options._hoistedOptions[0].value

        // Check if the message length doesn't exceed 280
        if(message.length > this.maxLength) {
            this.utils.logger.log("[TweetCommand] Message is too long (" + (message.length - this.maxLength) + " extra chars)")
            return interaction.reply({content: "Le message est trop long (" + (message.length - this.maxLength) + " caractères en trop)."});
        }

        const embed = this.utils.embed.embed().setTitle("✉️ Confirmation envoie de tweet")
            .setColor('#48aaf0')
            .setThumbnail(interaction.user.displayAvatarURL({dynamic: true, size: 1024}))
            .addField("Par", "<@!" + interaction.user.id + ">")
            .addField("Tweet", message)

        const reply = await interaction.reply({embeds: [embed], fetchReply: true})

        const mongoUpdated = await this.clients.mongo.insert("pendings",{
            "type"      : "tweet",
            "userId"    : interaction.user.id,
            "message"   : message,
            "messageId" : reply.id,
        })

        await this.clients.mongo.insert("historical", {
            "type"      : "pendingTweet",
            "userId"    : interaction.user.id,
            "message"   : message,
            "messageId" : reply.id,
            "date"      : (new Date()).getTime()
        })

        if(mongoUpdated) {
            await reply.react("✅")
            await reply.react("❌")
            this.utils.logger.log("[TweetCommand] Pending tweet has been saved")
        } else {
            await reply.editReply({content: "Une erreur est survenue lors de l'enregistrement en base de données."})
            this.utils.logger.log("[TweetCommand] An error occured while saving pending tweet")
        }
    }
}

module.exports = TweetCommand;