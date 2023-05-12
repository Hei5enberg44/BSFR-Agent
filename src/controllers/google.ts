import { google, Auth } from 'googleapis'
import config from '../config.json' assert { type: 'json' }

interface OAuth2Credentials {
    clientId: string,
    clientSecret: string,
    refreshToken?: string
}

const GoogleAuth = {
    /**
     * Authentification à Google API via OAuth2
     * @param credentials
     * @returns client OAuth2 Google
     */
    getOAuth2(credentials: OAuth2Credentials) {
        const oAuth2 = new google.auth.OAuth2({
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret
        })
        oAuth2.setCredentials({ refresh_token: credentials.refreshToken })
        return oAuth2
    },

    /**
     * Authentification à Google API via un compte de service
     * @param {object} credentials
     * @returns client de compte de service Google
     */
    async getServiceAccountAuth(credentials: object) {
        const auth = new Auth.GoogleAuth({
            scopes: [ 'https://www.googleapis.com/auth/cloud-platform' ],
            credentials: credentials
        })
        return auth
    }
}

interface YouTubeVideo {
    videoId: string,
    publishedAt: Date,
    title: string
}

const YouTube = {
    /**
     * Récupère les dernières vidéos publiques sur la chaîne YouTube
     * @returns liste des vidéos
     */
    async getLatestPublicsVideos(): Promise<YouTubeVideo[]> {
        const latestPublicsVideos: YouTubeVideo[] = []

        const auth = GoogleAuth.getOAuth2(config.google.youtube)

        const youtube = google.youtube({ version: 'v3', auth: auth })

        const videosList = await youtube.search.list({
            part: [ 'snippet' ],
            maxResults : 15,
            order : 'date',
            forMine : true,
            type : [ 'video' ],
            fields : 'items/id/videoId'
        })

        const videoListItems = videosList.data.items
        if(videoListItems) {
            const latestVideos = <string[]>videoListItems.map(video => video.id?.videoId)

            const videosInfos = await youtube.videos.list({
                part : [ 'status', 'snippet', 'liveStreamingDetails' ],
                id: latestVideos,
                fields : 'items(id,status/privacyStatus,snippet(publishedAt,title,liveBroadcastContent),liveStreamingDetails/scheduledStartTime)'
            })

            const videoInfosItems = videosInfos.data.items
            if(videoInfosItems) {
                for(const item of videoInfosItems) {
                    if(item.status?.privacyStatus === 'public') {
                        if(item.snippet?.liveBroadcastContent === 'upcoming') {
                            if(!item?.liveStreamingDetails?.scheduledStartTime) continue
                            const scheduledStartTime = new Date(item?.liveStreamingDetails?.scheduledStartTime).getTime()
                            if(Date.now() < scheduledStartTime) continue
                        }

                        if(item.id && item.snippet?.publishedAt && item.snippet?.title) {
                            latestPublicsVideos.push({
                                videoId: item.id,
                                publishedAt: new Date(item.snippet.publishedAt),
                                title: item.snippet.title
                            })
                        }
                    }
                }
            }
        }

        return latestPublicsVideos
    }
}

const TextToSpeech = {
    /**
     * Synthétise un texte en voix
     * @param text texte à synthétiser
     * @param voice voix à utiliser pour la synthèse vocale
     * @returns synthèse vocale
     */
    async synthesize(text: string, voice: string) {
        const auth = await GoogleAuth.getServiceAccountAuth(config.google['service-account'])

        const tts = google.texttospeech({ version: 'v1', auth: auth })

        const voiceSplit = voice.split('-')
        const languageCode = `${voiceSplit[0]}-${voiceSplit[1]}`

        const request = {
            input: { text: text },
            voice: { languageCode: languageCode, name: voice },
            audioConfig: { audioEncoding: 'OGG_OPUS' }
        }

        const synthesizedText = await tts.text.synthesize({
            requestBody: request
        })

        return synthesizedText.data.audioContent
    }
}

export { YouTube, TextToSpeech }