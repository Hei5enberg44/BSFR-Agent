import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Authentification à Google API
     * @returns {OAuth2Client} client Google
     */
    getAuth() {
        const oAuth2 = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret)

        oAuth2.setCredentials({ refresh_token: config.google.refreshToken })

        return oAuth2
    },

    /**
     * Récupère les dernières vidéos publiques sur la chaîne YouTube
     * @returns {Promise<Array<{videoId: string, publishedAt: string, title: string}>>} liste des vidéos
     */
    async getYoutubeLatestPublicsVideos() {
        const latestPublicsVideos = []

        const auth = this.getAuth()

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
            part : 'status,snippet,liveStreamingDetails',
            id: latestVideos.join(','),
            fields : 'items(id,status/privacyStatus,snippet(publishedAt,title,liveBroadcastContent),liveStreamingDetails/scheduledStartTime)'
        })

        for(const item of videosInfos.data.items) {
            if(item.status.privacyStatus === 'public') {
                if(item.snippet?.liveBroadcastContent === 'upcoming') {
                    const scheduledStartTime = new Date(item.liveStreamingDetails.scheduledStartTime).getTime()
                    if(Date.now() < scheduledStartTime) {
                        continue
                    }
                }

                latestPublicsVideos.push({
                    videoId: item.id,
                    publishedAt: item.snippet.publishedAt,
                    title: item.snippet.title
                })
            }
        }

        return latestPublicsVideos
    }
}