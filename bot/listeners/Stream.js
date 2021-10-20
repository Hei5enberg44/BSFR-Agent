class Stream {
    name = "Stream"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        // Keep the activity if the name is TWITCH
        const activity = data.activities.find(dataActivity => dataActivity.name.toUpperCase() === "TWITCH")

        // If there is an activity linked to twitch
        if(activity) {
            const member = this.guild.members.cache.get(data.user.id)

            // Check if the member have the streamer role
            const streamRole = member.roles.cache.find(role => role.name.toUpperCase() === "STREAMER")

            // If the member have the streamer role and the game streamed is Beat Saber
            if(streamRole && activity.state.toUpperCase() === "BEAT SABER") {
                // 150000 = 2min30
                if((new Date()).getTime() < activity.created_at + 150000) {
                    this.utils.logger.log("[Stream] " + member.user.tag + " is now streaming on " + activity.name + ": " + activity.url)

                    const twitchChannel = this.guild.channels.cache.get(this.config.ids.channels.twitch)

                    twitchChannel.send({content: "<@!" + member.user.id + "> - " + activity.details + " - " + activity.url, allowedMentions: {"users": []}})
                }
            }
        }
    }
}

module.exports = Stream;