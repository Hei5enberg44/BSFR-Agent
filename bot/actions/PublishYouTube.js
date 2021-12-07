const { google } = require("googleapis")

// Function to publish a YouTube video
async function publish(opt) {
    let auth = null

    try {
        auth = await opt.clients.google.getAuth(opt.clients)
    } catch (e) {
        const logsChannel = opt.guild.channels.cache.get(opt.config.ids.channels.logs)

        opt.utils.logger.log("[PublishYouTube] Something went wrong while getting access token")

        await logsChannel.send({content: "Quelque chose s'est mal passé pendant la récupération du token d'accès Google."})
        return false
    }

    if(auth !== null) {
        const videos = await opt.clients.mongo.find("videos", {})

        const youtube = google.youtube('v3')
        
        // Get the 30 last publics videos of the channel order by most recent
        let rawYoutubeVideos = []

        const response = await youtube.search.list({
            auth: auth,
            part: 'snippet',
            maxResults : 30,
            order : 'date',
            part : 'snippet',
            forMine : true,
            type : 'video',
            fields : 'items/id/videoId',
        })
    
        rawYoutubeVideos = response.data.items.map(youtubeVideo => { return youtubeVideo.id.videoId })
    
        let youtubeVideos = []
    
        let videosInfos = await youtube.videos.list({
            auth: auth,
            part : 'status,snippet',
            id: rawYoutubeVideos.join(',')
        })
    
        videosInfos.data.items.forEach(item => {
            if(item.status.privacyStatus.toLowerCase() === "public") {
                youtubeVideos.push(item.id)
            }
        })

        let newVideos

        // If there is at least one videos in database.
        // Create an array of the missing videos in database (which needs to be publish)
        if(videos.length > 0)
            newVideos = youtubeVideos.filter(x => !videos[0].ids.includes(x))
        else
            newVideos = youtubeVideos

        if(newVideos.length > 0) {
            opt.utils.logger.log("[PublishYouTube] Found " + newVideos.length + " new videos")

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
            await youtubeChannel.send({content: newVideos.map(video => "https://youtube.com/watch?v=" + video).join("\n") + " <@&" + opt.config.ids.roles.youtube + ">"})
        }
    }
}

module.exports = { publish }