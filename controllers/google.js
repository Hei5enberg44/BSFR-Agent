import { google, Auth } from 'googleapis'
import { OAuth2Client, JWT } from 'google-auth-library'
import config from '../config.json' assert { type: 'json' }

const GoogleAuth = {
    /**
     * @typedef {Object} OAuth2Credentials
     * @property {string} clientId
     * @property {string} clientSecret
     * @property {?string} refreshToken
     */

    /**
     * Authentification à Google API via OAuth2
     * @param {OAuth2Credentials} credentials
     * @returns {OAuth2Client} client OAuth2 Google
     */
    getOAuth2(credentials) {
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
     * @returns {Promise<JWT>} client de compte de service Google
     */
    async getServiceAccountAuth(credentials) {
        const auth = new Auth.GoogleAuth({
            scopes: [ 'https://www.googleapis.com/auth/cloud-platform' ],
            credentials: credentials
        })
        const client = await auth.getClient()
        return client
    }
}

const YouTube = {
    /**
     * @typedef {Object} YouTubeVideo
     * @property {string} videoId
     * @property {string} publishedAt
     * @property {string} title
     */

    /**
     * Récupère les dernières vidéos publiques sur la chaîne YouTube
     * @returns {Promise<Array<YouTubeVideo>>} liste des vidéos
     */
    async getLatestPublicsVideos() {
        const latestPublicsVideos = []

        const auth = GoogleAuth.getOAuth2(config.google.youtube)

        const youtube = google.youtube({ version: 'v3', auth: auth })

        const videosList = await new Promise((res, rej) => {
            youtube.search.list({
                part: 'snippet',
                maxResults : 15,
                order : 'date',
                forMine : true,
                type : 'video',
                fields : 'items/id/videoId'
            }, (err, response) => {
                if(err) rej(err)
                res(response)
            })
        })

        const latestVideos = videosList.data.items.map(video => video.id.videoId)

        const videosInfos = await new Promise((res, rej) => {
            youtube.videos.list({
                part : 'status,snippet,liveStreamingDetails',
                id: latestVideos.join(','),
                fields : 'items(id,status/privacyStatus,snippet(publishedAt,title,liveBroadcastContent),liveStreamingDetails/scheduledStartTime)'
            }, (err, response) => {
                if(err) rej(err)
                res(response)
            })
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

const TextToSpeech = {
    /**
     * Synthétise un texte en voix
     * @param {string} text texte à synthétiser
     * @param {string} voice voix à utiliser pour la synthèse vocale
     * @returns {Promise<Buffer>} synthèse vocale
     */
    async synthesize(text, voice) {
        const auth = await GoogleAuth.getServiceAccountAuth(config.google['service-account'])

        const tts = google.texttospeech({ version: 'v1', auth: auth })

        const voiceSplit = voice.split('-')
        const languageCode = `${voiceSplit[0]}-${voiceSplit[1]}`

        const request = {
            input: { text: text },
            voice: { languageCode: languageCode, name: voice },
            audioConfig: { audioEncoding: 'OGG_OPUS' }
        }

        /** @type {{data: {audioContent: string|null}}} */
        const response = await new Promise((res, rej) => {
            tts.text.synthesize({
                requestBody: request
            }, (err, response) => {
                if(err) rej(err)
                res(response)
            })
        })

        return response.data.audioContent
    }
}

export { YouTube, TextToSpeech }