const { google } = require('googleapis')
const { OAuth2Client } = require('google-auth-library')
const config = require('../config.json')

module.exports = {
    /**
     * Authentification à Google API
     * @returns {OAuth2Client} client Google
     */
    getAuth: function() {
        const oAuth2 = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)

        oAuth2.setCredentials({ refresh_token: config.google.refreshToken })

        return oAuth2
    },

    /**
     * Récupère les dernières vidéos publiques sur la chaîne YouTube
     * @returns {Promise<Array<{videoId: string, publishedAt: string, title: string}>>} liste des vidéos
     */
    getYoutubeLatestPublicsVideos: async function() {
        const latestPublicsVideos = []

        const auth = module.exports.getAuth()

        const youtube = google.youtube('v3')

        const videosList = await youtube.search.list({
            auth: auth,
            part: 'snippet',
            maxResults : 15,
            order : 'date',
            forMine : true,
            type : 'video',
            fields : 'items/id/videoId'
        })

        const latestVideos = videosList.data.items.map(video => video.id.videoId)

        const videosInfos = await youtube.videos.list({
            auth: auth,
            part : 'status,snippet',
            id: latestVideos.join(','),
            fields : 'items(id,status/privacyStatus,snippet(publishedAt,title))'
        })

        videosInfos.data.items.forEach(item => {
            if(item.status.privacyStatus.toLowerCase() === 'public') {
                latestPublicsVideos.push({
                    videoId: item.id,
                    publishedAt: item.snippet.publishedAt,
                    title: item.snippet.title
                })
            }
        })

        return latestPublicsVideos
    }
}