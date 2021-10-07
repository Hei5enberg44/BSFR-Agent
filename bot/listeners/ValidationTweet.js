class ValidationTweet {
    name = "ValidationTweet"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        const adminChannel  = await this.guild.channels.cache.get(this.config.ids.channels.admin)
        const logsChannel   = await this.guild.channels.cache.get(this.config.ids.channels.logs)
        const pendingTweet  = await this.clients.mongo.find("pendings", {type: "tweet", messageId: data.message_id})
        const member        = await this.guild.members.cache.get(data.user_id)

        // If it concerns a pending tweet and it's not the bot who react
        if(pendingTweet.length > 0 && data.user_id !== this.config.discord.clientId) {
            let embed = null
            if(data.emoji.name === "✅") {
                embed = this.utils.embed.embed().setColor('#48aaf0')
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true, size: 1024}))
                    .addField("Par", "<@!" + data.user_id + ">")
                    .addField("Tweet", pendingTweet[0].message)

                // Try to tweet
                try {
                    const tweet = await this.clients.twitter.tweet(pendingTweet[0].message)

                    await this.clients.mongo.insert("historical", {
                        "type"      : "tweet",
                        "userId"    : data.user_id,
                        "message"   : pendingTweet[0].message,
                        "tweetId"   : tweet.id,
                        "date"      : (new Date()).getTime()
                    })

                    this.utils.logger.log("[TweetCommand] Tweet successfully sent")
                    await embed.setTitle("✉️ Envoi d'un tweet")
                } catch (e) {
                    this.utils.logger.log("[TweetCommand] An error occured - " + e)
                    await embed.setTitle("✉️ Échec d'envoi d'un tweet")
                }


            }

            if(data.emoji.name === "❌") {
                embed = this.utils.embed.embed().setTitle("✉️ Refus d'envoi d'un tweet")
                    .setColor('#48aaf0')
                    .setThumbnail(member.user.displayAvatarURL({dynamic: true, size: 1024}))
                    .addField("Par", "<@!" + data.user_id + ">")
                    .addField("Tweet", pendingTweet[0].message)
            }

            if(["❌", "✅"].includes(data.emoji.name)) {
                await logsChannel.send({embeds: [embed]})

                const message = await adminChannel.messages.fetch(data.message_id)

                await message.delete()

                await this.clients.mongo.remove("pendings", {type: "tweet", messageId: data.message_id})
            }
        }
    }
}

module.exports = ValidationTweet;