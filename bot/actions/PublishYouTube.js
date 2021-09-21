const axios = require('axios');

async function publish(opt) {
    let videos = await opt.clients.mongo.find("videos", {})

    let youtubeVideos = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
            order: "date",
            part: "snippet",
            maxResults: 20,
            channelId: opt.config.youtube.channelId,
            key: opt.config.youtube.apiKey
        }
    })

    youtubeVideos = youtubeVideos.data.items.map((youtubeVideo) => {return youtubeVideo.id.videoId})
    let videosToPublish = []

    if(videos.length > 0)
        videosToPublish = youtubeVideos.filter(x => !videos[0].ids.includes(x))
    else
        videosToPublish = youtubeVideos

    opt.utils.logger.log("[PublishYouTube] Found " + videosToPublish.length + " new videos")

    if(videosToPublish.length > 0) {
        let mongoUpdated = null

        if(videos.length > 0)
            mongoUpdated = await opt.clients.mongo.update("videos", { "_id": videos[0]._id }, { $set: { ids: youtubeVideos } })
        else
            mongoUpdated = await opt.clients.mongo.insert("videos", { ids: youtubeVideos })

        if(mongoUpdated){
            opt.utils.logger.log("[PublishYouTube] Videos has been saved.")
        } else {
            opt.utils.logger.log("[PublishYouTube] Can't save videos.")
            return false;
        }

        const guild     = opt.clients.discord.getClient().guilds.cache.get(opt.config.discord.guildId)
        const channel   = guild.channels.cache.get(opt.config.ids.channels.youtube)

        opt.utils.logger.log("[PublishYouTube] Sending videos links on discord.")
        channel.send(videosToPublish.map(video => "https://youtube.com/watch?v=" + video).join("\n") + " <@&" + opt.config.ids.roles.youtube + ">")
    }
}

module.exports = { publish }