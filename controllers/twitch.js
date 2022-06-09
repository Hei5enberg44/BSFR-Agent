const { Client, Message, MessageAttachment } = require('discord.js')
const Embed = require('../utils/embed')
const { hyperlink } = require('@discordjs/builders')
const { TwitchError, NextcloudError } = require('../utils/error')
const { Twitch } = require('./database')
const fetch = require('node-fetch')
const crypto = require('crypto')
const tmp = require('tmp')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')
const nextcloud = require('../controllers/nextcloud')
const Logger = require('../utils/logger')
const config = require('../config.json')

const twitchGqlClientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko'

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
                if(result) {
                    uploadedClipsCount++
                } else {
                    const logsChannel = message.guild.channels.cache.find(c => c.id === config.guild.channels.logs)
                    const embed = new Embed()
                        .setColor('#E74C3C')
                        .setTitle('🎬 Échec de l\'upload d\'un clip')
                        .setDescription(`Une erreur est survenue lors de l'upload du clip ${url}`)
                    await logsChannel.send({ embeds: [embed] })
                }
            }

            const attachments = message.attachments

            for(const [, attachment] of attachments.entries()) {
                if(attachment.contentType.match(/(video)/i)) {
                    Logger.log('Clips', 'INFO', 'Récupération d\'un clip Twitch de la part de ' + message.author.tag)
                    const result = await module.exports.getClipByAttachment(attachment, message.author.id)
                    if(result) {
                        uploadedClipsCount++
                    } else {
                        const logsChannel = message.guild.channels.cache.find(c => c.id === config.guild.channels.logs)
                        const embed = new Embed()
                            .setColor('#E74C3C')
                            .setTitle('🎬 Échec de l\'upload d\'un clip')
                            .setDescription(`Une erreur est survenue lors de l'upload du clip ${attachment.url}`)
                        await logsChannel.send({ embeds: [embed] })
                    }
                }
            }

            if(uploadedClipsCount > 0) {
                const logsChannel = message.guild.channels.cache.find(c => c.id === config.guild.channels.logs)
                const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle('🎬 Nouveau(x) clip(s) uploadé(s) !')
                    .setDescription(`${message.author.tag} a uploadé ${uploadedClipsCount} clip(s)`)
                await logsChannel.send({ embeds: [embed] })

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
            let file, createdAt, broadcasterName
            if(!url.includes('https://www.twitch.tv/videos/')) {
                const slug = url.substring(url.lastIndexOf('/') + 1, url.length)
                const clipInfos = await module.exports.getClipInfos(slug)
                createdAt = clipInfos.data.clip.createdAt
                broadcasterName = clipInfos.data.clip.broadcaster.displayName
                const downloadUrl = await module.exports.getClipDownloadUrl(slug)
                file = await module.exports.downloadClip(downloadUrl)
            } else {
                const videoId = url.substring(url.lastIndexOf('/') + 1, url.length)
                const videoInfos = await module.exports.getVideoInfos(videoId)
                createdAt = videoInfos.data.video.createdAt
                broadcasterName = videoInfos.data.video.creator.login
                file = await module.exports.downloadVideo(videoId)
            }

            try {
                const hash = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
                const fileName = `${module.exports.convertDate(new Date(createdAt))}_${hash}`
                const folderName = 'Twitch-' + broadcasterName

                const newFolder = await nextcloud.createFolder(`${config.twitch.clipsLocation}/${folderName}`)
                await nextcloud.uploadFile(file.name, `${newFolder.name}/${fileName}.mp4`)
            } catch(error) {
                if(error instanceof NextcloudError) {
                    file.removeCallback()
                    throw new TwitchError(error.message)
                }
            }

            file.removeCallback()

            return true
        } catch(error) {
            if(error instanceof TwitchError) {
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
     * @param {String} memberId identifiant du membre Discord ayant uploadé le clip
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
                    throw new TwitchError(error.message)
                }
            }

            file.removeCallback()

            return true
        } catch(error) {
            if(error instanceof TwitchError) {
                Logger.log('Clips', 'WARNING', error.message)
                return false
            } else {
                throw new TwitchError(error.message)
            }
        }
    },

    /**
     * Récupération des informations d'un clip
     * @param {String} ClipSlug identifiant du clip
     * @returns {Promise<Object>} informations du clip
     */
    getClipInfos: async function(ClipSlug) {
        const clipInfosRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify({"query":"query{clip(slug:\"" + ClipSlug + "\"){title,createdAt,broadcaster{id,displayName},video{id}}}","variables":{}})
        })

        if(clipInfosRequest.ok) {
            const clipInfos = await clipInfosRequest.json()

            if(!clipInfos.data.clip) {
                throw new TwitchError('Le clip demandé n\'existe pas')
            }

            return clipInfos
        } else {
            throw new TwitchError('Récupération des informations du clip impossible')
        }
    },

    /**
     * Récupère le lien de téléchargement d'un clip
     * @param {String} clipSlug identifiant du clip
     * @returns {Promise<String>} lien de téléchargement du clip
     */
    getClipDownloadUrl: async function(clipSlug) {
        const clipLinksRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify([{"operationName":"VideoAccessToken_Clip","variables":{"slug":clipSlug},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"36b89d2507fce29e5ca551df756d27c1cfe079e2609642b4390aa4c35796eb11"}}}])
        })

        if(clipLinksRequest.ok) {
            const clipLinks = await clipLinksRequest.json()

            if(!clipLinks[0].data.clip) {
                throw new TwitchError('Le clip demandé n\'existe pas')
            }

            const downloadUrl = clipLinks[0].data.clip.videoQualities[0].sourceURL + `?sig=${clipLinks[0].data.clip.playbackAccessToken.signature}&token=${encodeURIComponent(clipLinks[0].data.clip.playbackAccessToken.value)}`
            return downloadUrl
        } else {
            throw new Error('Récupération de l\'URL de téléchargement du clip impossible')
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
     * Récupération du token d'une VOD
     * @param {String} videoId identifiant de la VOD
     * @returns {Promise<Object>} token de la VOD
     */
    getVideoToken: async function(videoId) {
        const videoTokenRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify({"operationName":"PlaybackAccessToken_Template","query":"query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isLive) { value signature __typename } videoPlaybackAccessToken(id: $vodID, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isVod) { value signature __typename }}", "variables": {"isLive":false,"login":"","isVod":true,"vodID":videoId,"playerType":"site"}})
        })

        const videoToken = await videoTokenRequest.json()
        return videoToken
    },

    /**
     * Récupération de la liste des chunks constituants une VOD
     * @param {String} videoId identifiant de la VOD
     * @param {String} token token de la VOD
     * @param {String} sig signature de la VOD
     * @returns {Promise<String>} liste des chunks constituants la VOD
     */
    getVideoPlaylist: async function(videoId, token, sig) {
        const params = new URLSearchParams({
            nauth: token,
            nauthsig: sig,
            allow_source: true,
            player: 'twitchweb'
        }).toString()

        const videoPlaylistRequest = await fetch(`http://usher.twitch.tv/vod/${videoId}?${params}`, {
            method: 'GET',
            headers: {
                'Client-ID': twitchGqlClientId
            }
        })
        
        if(!videoPlaylistRequest.ok) {
            if(videoPlaylistRequest.status === 403) {
                return null
            } else {
                throw new Error(videoPlaylistRequest.statusText)
            }
        } else {
            const videoPlaylist = await videoPlaylistRequest.text()
            return videoPlaylist
        }
    },

    /**
     * Récupération d'un fichier playlist contenant la liste des chunks constituants une VOD
     * @param {String} videoId identifiant de la VOD
     * @returns {Promise<String>} URL du fichier playlist
     */
    getRestrictedVideoPlaylist: async function(videoId) {
        const videoInfosRequest = await fetch(`https://api.twitch.tv/kraken/videos/${videoId}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Client-ID': twitchGqlClientId,
                'Accept': 'application/vnd.twitchtv.v5+json'
            }
        })

        if(!videoInfosRequest.ok) {
            throw new Error(videoInfosRequest.statusText)
        } else {
            const videoInfos = await videoInfosRequest.json()
            const domain = videoInfos.animated_preview_url.split('/storyboards')[0]
            return domain + '/chunked/index-dvr.m3u8'
        }
    },

    /**
     * Récupération des informations d'une VOD
     * @param {String} videoId identifiant de la VOD
     * @returns {Promise<Object>} informations de la VOD
     */
    getVideoInfos: async function(videoId) {
        const clipInfosRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify({"query":"query{video(id:\"" + videoId + "\"){createdAt,creator{login}}}","variables":{}})
        })

        if(clipInfosRequest.ok) {
            const clipInfos = await clipInfosRequest.json()

            if(!clipInfos.data.video) {
                throw new TwitchError('La vidéo demandée n\'existe pas')
            }

            return clipInfos
        } else {
            throw new TwitchError('Récupération des informations de la vidéo impossible')
        }
    },

    /**
     * Téléchargement d'un chunk d'une VOD
     * @param {String} url URL de téléchargement du chunk
     * @param {String} path chemin vers le fichier de destination
     */
    downloadChunk: async function(url, path) {
        const downloadRequest = await fetch(url, {
            method: 'GET'
        })

        if(downloadRequest.ok) {
            const fileStream = fs.createWriteStream(path)
            await new Promise((resolve, reject) => {
                downloadRequest.body.pipe(fileStream)
                downloadRequest.body.on('error', reject)
                fileStream.on('finish', resolve)
            })
        } else {
            throw new Error(JSON.stringify({
                status: downloadRequest.status,
                statusText: downloadRequest.statusText
            }))
        }
    },

    /**
     * Téléchargement d'une VOD
     * @param {String} videoId identifiant de la VOD à télécharger
     * @returns {Promise<tmp.FileResult>} fichier téléchargé
     */
    downloadVideo: async function(videoId) {
        const videoToken = await module.exports.getVideoToken(videoId)
        const videoPlaylistRaw = await module.exports.getVideoPlaylist(videoId, videoToken.data.videoPlaybackAccessToken.value, videoToken.data.videoPlaybackAccessToken.signature)
        
        let vodAge = 25
        let playlistUrl
        if(videoPlaylistRaw) {
            const videoPlaylist = videoPlaylistRaw.split('\n')
            playlistUrl = videoPlaylist[videoPlaylist.findIndex(vp => vp.includes('#EXT-X-MEDIA')) + 2]
        } else {
            playlistUrl = await module.exports.getRestrictedVideoPlaylist(videoId)
        }

        const baseUrl = playlistUrl.substring(0, playlistUrl.lastIndexOf('/') + 1)
        
        const videoChunksRequest = await fetch(playlistUrl, {
            method: 'GET'
        })
        const videoChunks = (await videoChunksRequest.text()).split('\n')

        try {
            const vodDate = videoChunks.find(vc => vc.includes('#ID3-EQUIV-TDTG:')).replace('#ID3-EQUIV-TDTG:', '')
            vodAge = Math.round((new Date() - new Date(vodDate)) / 3600000)
        } catch { }

        const videoList = []
        for(let i = 0; i < videoChunks.length; i++) {
            if(videoChunks[i].includes('#EXTINF')) {
                if(videoChunks[i + 1].includes('#EXT-X-BYTERANGE')) {
                    if(videoList.find(vl => vl.key === videoChunks[i + 2])) {
                        const pair = videoList.find(vl => vl.key === videoChunks[i + 2])
                        pair.value += parseFloat(videoChunks[i].substring(8, videoChunks[i].length - 1))
                    } else {
                        videoList.push({
                            key: videoChunks[i + 2],
                            value: parseFloat(videoChunks[i].substring(8, videoChunks[i].length - 1))
                        })
                    }
                } else {
                    videoList.push({
                        key: videoChunks[i + 1],
                        value: parseFloat(videoChunks[i].substring(8, videoChunks[i].length - 1))
                    })
                }
            }
        }

        const tmpChunks = []
        for(const video of videoList) {
            let isDone = false
            let tryUnmute = vodAge < 24
            tryUnmute = true
            let errorCount = 0

            const fileName = video.key.includes('?') ? video.key.split('?')[0] : video.key
            const tmpChunk = tmp.fileSync({ name: `${videoId}-${fileName}` })

            while(!isDone && errorCount < 10) {
                try {
                    if(tryUnmute && video.key.includes('-muted')) {
                        await module.exports.downloadChunk(baseUrl + video.key.replace('-muted', ''), tmpChunk.name)
                    } else {
                        await module.exports.downloadChunk(baseUrl + video.key, tmpChunk.name)
                    }

                    isDone = true
                } catch(error) {
                    errorCount++
                    
                    const err = JSON.parse(error.message)
                    if(err.status && err.status === 403) {
                        tryUnmute = false
                    } else {
                        await new Promise(res => setTimeout(res, 5000))
                    }
                }
            }

            if(!isDone) {
                tmpChunk.removeCallback()
                throw new TwitchError('Échec du téléchargement de la VOD')
            } else {
                tmpChunks.push(tmpChunk)
            }
        }

        const outputTmp = tmp.fileSync({ name: `${videoId}-output.ts` })
        const outputStream = fs.createWriteStream(outputTmp.name)
        for(const tmpChunk of tmpChunks) {
            if(fs.existsSync(tmpChunk.name)) {
                const inputStream = fs.createReadStream(tmpChunk.name)
                await new Promise(resolve => {
                    inputStream.pipe(outputStream, { end: false })
                    inputStream.on('end', () => {
                        resolve()
                    })
                })
                tmpChunk.removeCallback()
            }
        }

        const outputConvertedTmp = tmp.fileSync({ name: `${videoId}.mp4` })
        return new Promise((resolve, reject) => {
            ffmpeg(outputTmp.name)
                .outputOptions([
                    '-avoid_negative_ts make_zero',
                    '-analyzeduration ' + Number.MAX_SAFE_INTEGER,
                    '-probesize ' + Number.MAX_SAFE_INTEGER,
                    '-c copy'
                ])
                .save(outputConvertedTmp.name)
                .on('end', () => {
                    outputTmp.removeCallback()
                    resolve(outputConvertedTmp)
                })
                .on('error', () => {
                    outputConvertedTmp.removeCallback()
                    outputTmp.removeCallback()
                    reject()
                })
        })
    },

    /**
     * Recherche les membres en live sur Twitch et envoie une notification dans le channel #twitch-youtube
     * @param {Client} client client Discord
     */
    live: async function(client) {
        try {
            const gameId = '503116'
            const accessToken = await module.exports.getToken()
            
            if(accessToken) {
                const streamers = await Twitch.findAll()

                const users = new URLSearchParams()
                for(const streamer of streamers) {
                    users.append('user_login', streamer.channelName)
                }

                try {
                    const streaming = await new Promise(async (resolve, reject) => {
                        const streams = []
                        let after = null

                        do {
                            const streamsRequest = await fetch(`https://api.twitch.tv/helix/streams?${after ? `after=${after}&` : ''}first=50&${users.toString()}`, {
                                headers: {
                                    'Authorization': 'Bearer ' + accessToken,
                                    'Client-Id': config.twitch.clientId
                                }
                            })

                            if(streamsRequest.ok) {
                                const streamsResult = await streamsRequest.json()
                                streams.push(...streamsResult.data)
                                after = streamsResult.pagination.cursor ?? null
                            } else {
                                after = null
                                reject(`Récupération de la liste des membres en stream impossible (${streamsRequest.status}: ${streamsRequest.statusText})`)
                            }
                        } while(after)

                        resolve(streams)
                    })

                    for(const streamer of streamers) {
                        const user = streaming.find(s => s.user_name.toLowerCase() === streamer.channelName.toLowerCase() && s.type === 'live' && s.game_id === gameId)
                        
                        if(user) {
                            const userLogin = user.user_login
                            const gameName = user.game_name
                            const title = user.title
                            const viewerCount = user.viewer_count.toString()
                            const thumbnailUrl = user.thumbnail_url.replace('{width}', 1280).replace('{height}', 720) + '?c=' + (new Date()).getTime()

                            const guild = client.guilds.cache.find(g => g.id === config.guild.id)
                            const member = guild.members.cache.find(m => m.id === streamer.memberId)
                            const twitchChannel = guild.channels.cache.find(c => c.id === config.guild.channels.twitch)

                            const embed = new Embed()
                                .setColor('#6441A5')
                                .setTitle(`${member.displayName} est en live !`)
                                .setDescription(`${hyperlink(title, `https://www.twitch.tv/${userLogin}`)}`)
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: 'Jeu', value: gameName, inline: true },
                                    { name: '\u200b', value: '\u200b', inline: true },
                                    { name: 'Viewers', value: viewerCount, inline: true }
                                )
                                .setImage(thumbnailUrl)
                            
                            if(!streamer.live) {
                                const message = await twitchChannel.send({ embeds: [embed] })
                                
                                streamer.live = true
                                streamer.messageId = message.id
                                await streamer.save()

                                Logger.log('Twitch', 'INFO', `${member.user.tag} est en live !`)
                            } else {
                                if(streamer.messageId !== '') {
                                    const message = await twitchChannel.messages.fetch(streamer.messageId)
                                    await message.edit({ embeds: [embed] })
                                }
                            }
                        } else {
                            if(streamer.live) {
                                streamer.live = false
                                streamer.messageId = ''
                                await streamer.save()
                            }
                        }
                    }
                } catch(error) {
                    throw new TwitchError(error)
                }
            }
        } catch(error) {
            if(error instanceof TwitchError) {
                Logger.log('Twitch', 'ERROR', error.message)
            } else {
                throw new TwitchError(error.message)
            }
        }
    },

    /**
     * Lie un compte Twitch à un membre Discord
     * @param {String} memberId identifiant du membre Discord auquel lier à un compte Twitch
     * @param {String} channelName nom de la chaîne Twitch à lier au membre Discord
     */
    link: async function(memberId, channelName) {
        const streamer = await Twitch.findOne({ where: { memberId: memberId } })

        if(streamer) {
            streamer.channelName = channelName
            streamer.live = false
            streamer.messageId = ''
            streamer.save()
        } else {
            await Twitch.create({
                memberId: memberId,
                channelName: channelName,
                live: false,
                messageId: ''
            })
        }
    },

    /**
     * Délie un compte Twitch d'un membre Discord
     * @param {String} memberId identifiant du membre Discord pour lequel délier un compte Twitch
     */
    unlink: async function(memberId) {
        await Twitch.destroy({ where: { memberId: memberId } })
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