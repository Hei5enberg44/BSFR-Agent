class TweetCommand {
    name = "tweet"
    description = "Tweet sur le compte @BeatSaberFR"
    options = {
        "message": {
            "name": "texte",
            "type": "string",
            "description": "Ne pas dépasser 280 caractères",
            "required": true
        }
    }
    roles = ["Admin"]

    maxLength = 280

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        if(this.config.ids.channels.admin !== interaction.channelId) {
            this.utils.logger.log("[TweetCommand] Command executed in the wrong channel")
            return interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.admin + ">", ephemeral: true});
        }

        const message = interaction.options._hoistedOptions[0].value

        if(message.length > this.maxLength) {
            this.utils.logger.log("[TweetCommand] Message is too long (" + message.length - this.maxLength + " extra chars)")
            return interaction.reply({content: "Le message est trop long (" + message.length - this.maxLength + " caractères en trop)"});
        }

        try {
            const tweet = await this.clients.twitter.tweet(message)

            await this.clients.mongo.insert("historical", {
                "type"      : "tweet",
                "userId"    : interaction.user.id,
                "message"   : message,
                "tweetId"   : tweet.id,
                "date"      : (new Date()).getTime()
            })

            this.utils.logger.log("[TweetCommand] Tweet successfully sent")
            return interaction.reply({content: "Le tweet a bien été envoyé."});
        } catch (e) {
            this.utils.logger.log("[TweetCommand] An error occured - " + e)
            return interaction.reply({content: "Une erreur c'est produite."});
        }
    }
}

module.exports = TweetCommand;