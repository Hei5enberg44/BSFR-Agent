const { Message, MessageAttachment } = require('discord.js')
const { TwitchError, NextcloudError } = require('../utils/error')
const fetch = require('node-fetch')
const crypto = require('crypto')
const tmp = require('tmp')
const fs = require('fs')
const nextcloud = require('../controllers/nextcloud')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Retourne l'Access Token de Twitch API
     * @returns {Promise<String>} Access Token
     */
    getToken: async function() {
        const params = new URLSearchParams({
            client_id: config.twitch.clientId,
            client_secret: config.twitch.clientSecret,
            grant_type: 'client_credentials'
        }).toString()

        const url = 'https://id.twitch.tv/oauth2/token?' + params

        const authRequest = await fetch(url, {
            method: 'POST'
        })

        if(authRequest.ok) {
            const auth = await authRequest.json()
            return auth.access_token
        } else {
            throw new TwitchError('Échec de la connexion à Twitch')
        }
    },

    /**
     * Récupère les informations concernant un clip
     * @param {String} url lien du clip
     * @returns {Promise<Object>} informations du clip
     */
    getClipInfos: async function(url) {
        try {
            const accessToken = await module.exports.getToken()
            
            if(accessToken) {
                const clipId = url.includes('https://clips.twitch.tv/') ? url.split('https://clips.twitch.tv/')[1] : url.replace(/https:\/\/www\.twitch\.tv\/[^\/]+\/clip\/([^\/]+)/i, '$1')

                const clipRequest = await fetch('https://api.twitch.tv/helix/clips?id=' + clipId, {
                    headers: {
                        'Authorization': 'Bearer ' + accessToken,
                        'Client-Id': config.twitch.clientId
                    }
                })

                if(clipRequest.ok) {
                    const clip = await clipRequest.json()

                    if(clip.data.length === 0) throw new TwitchError(`Récupération des informations du clip impossible (url: ${url})`)

                    return clip.data[0]
                }
            }
        } catch(error) {
            throw new TwitchError(error.message)
        }
    },

    /**
     * Télécharge un clip vers un fichier temporaire
     * @param {String} url url du fichier à télécharger
     * @returns {Promise<tmp.FileResult>} fichier temporaire téléchargé
     */
    downloadClip: async function(url) {
        const tmpFile = tmp.fileSync()

        try {
            const response = await fetch(url)
            const buffer = await response.buffer()

            await new Promise((resolve, reject) => {
                fs.writeFile(tmpFile.name, buffer, (err) => {
                    if(err) reject(err)
                    resolve()
                })
            })

            return tmpFile
        } catch(error) {
            tmpFile.removeCallback()
            throw new TwitchError('Échec de téléchargement du clip')
        }
    },

    /**
     * Récupération des clips depuis un message Discord
     * @param {Message} message The created message
     */
    getClip: async function(message) {
        try {
            const clipsList = message.content.replace(/\n/g, ' ').split(' ').filter(x => x.includes('https://clips.twitch.tv/') || x.includes('https://www.twitch.tv/'))

            let uploadedClipsCount = 0

            for(const url of clipsList) {
                Logger.log('Clips', 'INFO', 'Récupération d\'un clip Twitch de la part de ' + message.author.tag)
                const result = await module.exports.getClipByUrl(url)
                if(result) uploadedClipsCount++
            }

            const attachments = message.attachments

            for(const [, attachment] of attachments.entries()) {
                if(attachment.contentType.match(/(video)/i)) {
                    Logger.log('Clips', 'INFO', 'Récupération d\'un clip Twitch de la part de ' + message.author.tag)
                    const result = await module.exports.getClipByAttachment(attachment, message.author.id)
                    if(result) uploadedClipsCount++
                }
            }

            if(uploadedClipsCount > 0) {
                Logger.log('Clips', 'INFO', `${uploadedClipsCount} clip(s) uploadé(s)`)
            }
        } catch(error) {
            throw new TwitchError(error.message)
        }
    },

    /**
     * Récupération d'un clip depuis un lien de clip Twitch
     * @param {String} url lien vers le clip Twitch
     * @returns {Promise<Boolean>}
     */
    getClipByUrl: async function(url) {
        try {
            const clipInfos = await module.exports.getClipInfos(url)
            const downloadUrl = clipInfos.thumbnail_url.split('-preview')[0] + '.mp4'

            const file = await module.exports.downloadClip(downloadUrl)

            try {
                const hash = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
                const fileName = `${module.exports.convertDate(new Date(clipInfos.created_at))}_${hash}`
                const folderName = 'Twitch-' + clipInfos.broadcaster_name

                const newFolder = await nextcloud.createFolder(`${config.twitch.clipsLocation}/${folderName}`)
                await nextcloud.uploadFile(file.name, `${newFolder.name}/${fileName}.mp4`)
            } catch(error) {
                if(error instanceof NextcloudError) {
                    file.removeCallback()
                    throw new NextcloudError(error.message)
                }
            }

            file.removeCallback()

            return true
        } catch(error) {
            if(error instanceof TwitchError || error instanceof NextcloudError) {
                Logger.log('Clips', 'WARNING', error.message)
                return false
            } else {
                throw new TwitchError(error.message)
            }
        }
    },

    /**
     * Récupération d'un clip depuis une pièce jointe à un message Discord
     * @param {MessageAttachment} attachment pièce jointe d'un message Discord
     * @param {String} memberId identifiant du membre Discord aillant uploadé le clip
     * @returns {Promise<Boolean>}
     */
    getClipByAttachment: async function(attachment, memberId) {
        try {
            const file = await module.exports.downloadClip(attachment.url)

            try {
                const hash = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
                const fileName = `${module.exports.convertDate(new Date())}_${hash}`
                const folderName = 'Discord-' + memberId

                const newFolder = await nextcloud.createFolder(`${config.twitch.clipsLocation}/${folderName}`)
                await nextcloud.uploadFile(file.name, `${newFolder.name}/${fileName}.mp4`)
            } catch(error) {
                if(error instanceof NextcloudError) {
                    file.removeCallback()
                    throw new NextcloudError(error.message)
                }
            }

            file.removeCallback()

            return true
        } catch(error) {
            if(error instanceof TwitchError || error instanceof NextcloudError) {
                Logger.log('Clips', 'WARNING', error.message)
                return false
            } else {
                throw new TwitchError(error.message)
            }
        }
    },

    /**
     * Convertit une date au format yyyy-mm-dd hh:ii
     * @param {Date} date date à convertir
     * @returns {String} date convertie
     */
    convertDate: function(date) {
        const year = date.getFullYear()
        const month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
        const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()

        return `${year}-${month}-${day} ${hours}:${minutes}`
    }
}