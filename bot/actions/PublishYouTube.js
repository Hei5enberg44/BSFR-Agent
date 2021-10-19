const axios = require('axios');

// Function to publish a YouTube,
async function publish(opt) {
    const accessToken = await opt.clients.google.getAccessToken(opt.clients)

    if(accessToken !== null && accessToken !== "authorization needed") {
        const videos = await opt.clients.mongo.find("videos", {})

        // Get the 20 last videos of the channel order by most recent
        let youtubeVideos = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            headers: {
                Authorization: "Bearer " + accessToken
            },
            params: {
                maxResults  : 20,
                order       : "date",
                part        : "snippet",
                forMine     : true,
                type        : "video"
            }
        })

        // Overwrite the variable to only get an array of videos ids.
        youtubeVideos = youtubeVideos.data.items.map((youtubeVideo) => {return youtubeVideo.id.videoId})

        let videosToPublish

        // If there is at least one videos in database.
        // Create an array of the missing videos in database (which needs to be publish)
        if(videos.length > 0)
            videosToPublish = youtubeVideos.filter(x => !videos[0].ids.includes(x))
        else
            videosToPublish = youtubeVideos

        if(videosToPublish.length > 0) {
            opt.utils.logger.log("[PublishYouTube] Found " + videosToPublish.length + " new videos")

            let mongoUpdated

            // If there is at least one video in database
            if(videos.length > 0) {
                // Update the document to set the new videos ids
                mongoUpdated = await opt.clients.mongo.update("videos", { "_id": videos[0]._id }, { $set: { ids: youtubeVideos } })
            } else {
                // Insert a new document with all the videos ids
                mongoUpdated = await opt.clients.mongo.insert("videos", { ids: youtubeVideos })
            }

            if(mongoUpdated){
                opt.utils.logger.log("[PublishYouTube] Videos has been saved.")
            } else {
                opt.utils.logger.log("[PublishYouTube] Can't save videos.")
                return false;
            }

            const youtubeChannel = opt.guild.channels.cache.get(opt.config.ids.channels.youtube)

            opt.utils.logger.log("[PublishYouTube] Sending videos links on discord.")

            // Send all the videos in one message in the youtube discord channel
            await youtubeChannel.send(videosToPublish.map(video => "https://youtube.com/watch?v=" + video).join("\n") + " <@&" + opt.config.ids.roles.youtube + ">")
        }
    }
}

module.exports = { publish }