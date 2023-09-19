import * as fs from 'node:fs'
import * as path from 'node:path'
import crypto from 'crypto'
import tmp from 'tmp'
import pLimit from 'p-limit'
import ffmpeg from 'fluent-ffmpeg'
import { Client, Guild, GuildMember, Message, Attachment, TextChannel, userMention, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import { TwitchModel } from './database.js'
import nextcloud from '../controllers/nextcloud.js'
import { TwitchError } from '../utils/error.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

interface ClipInfosData {
    clip: {
        title: string,
        createdAt: string,
        broadcaster: {
            id: string,
            displayName: string
        }
    }
}

interface VODTokenData {
    videoPlaybackAccessToken: {
        value: string,
        signature: string
    }
}

interface VODInfosData {
    video: {
        title: string,
        createdAt: string,
        creator:  {
            login: string
        }
    }
}

interface StreamData {
    id: string,
    user_id: string,
    user_login: string,
    user_name: string,
    game_id: string,
    game_name: string,
    type: string,
    title: string,
    tags: string[],
    viewer_count: number,
    started_at: string,
    language: string,
    thumbnail_url: string,
    tag_ids: string[];
    is_mature: boolean
}

const twitchGqlClientId = 'kimne78kx3ncx6brgo4mv6wki5h1ko'

export default class Twitch {
    /**
     * Retourne l'Access Token de Twitch API
     * @returns Access Token
     */
    private static async getToken(): Promise<string> {
        const params = new URLSearchParams({
            client_id: config.twitch.clientId,
            client_secret: config.twitch.clientSecret,
            grant_type: 'client_credentials'
        }).toString()

        const url = `https://id.twitch.tv/oauth2/token?${params}`

        const authRequest = await fetch(url, {
            method: 'POST'
        })

        if(authRequest.ok) {
            const auth = await authRequest.json()
            return auth.access_token
        } else {
            throw new TwitchError('Échec de la connexion à Twitch')
        }
    }

    /**
     * Récupération des clips depuis un message Discord
     * @param message The created message
     */
    static async getClip(message: Message) {
        try {
            const clipsList = message.content.replace(/\n/g, ' ').split(' ').filter(x => x.includes('https://clips.twitch.tv/') || x.includes('https://www.twitch.tv/'))
            const attachments = message.attachments

            if(clipsList.length === 0 && attachments.size === 0) {
                const member = <GuildMember>message.member
                if(!member.roles.cache.find(r => r.id === config.guild.roles['Admin'] || r.id === config.guild.roles['Modérateur'])) {
                    try {
                        await message.delete()
                        await member.send({ content: `Pas de discussion dans le salon ${message.channel.url} stp.\nMerci.` })
                    } catch(e) {}
                }
            }

            let uploadedClipsCount = 0

            const guild = <Guild>message.guild
            const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])

            for(const url of clipsList) {
                Logger.log('Clips', 'INFO', 'Récupération d\'un clip Twitch de la part de ' + message.author.username)
                const result = await this.getClipByUrl(url)
                if(result) {
                    uploadedClipsCount++
                } else {
                    const embed = new Embed()
                        .setColor('#E74C3C')
                        .setTitle('🎬 Échec de l\'upload d\'un clip')
                        .setDescription(`Une erreur est survenue lors de l'upload du clip ${url}`)
                    await logsChannel.send({ embeds: [embed] })
                }
            }

            for(const [, attachment] of attachments.entries()) {
                if(attachment.contentType && attachment.contentType.match(/(video)/i)) {
                    Logger.log('Clips', 'INFO', 'Récupération d\'un clip Twitch de la part de ' + message.author.username)
                    const result = await this.getClipByAttachment(attachment, message.author.id)
                    if(result) {
                        uploadedClipsCount++
                    } else {
                        const embed = new Embed()
                            .setColor('#E74C3C')
                            .setTitle('🎬 Échec de l\'upload d\'un clip')
                            .setDescription(`Une erreur est survenue lors de l'upload du clip ${attachment.url}`)
                        await logsChannel.send({ embeds: [embed] })
                    }
                }
            }

            if(uploadedClipsCount > 0) {
                const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle('🎬 Nouveau(x) clip(s) uploadé(s) !')
                    .setDescription(`${userMention(message.author.id)} a uploadé ${uploadedClipsCount} clip(s) – ${hyperlink('Voir', message.url)}`)
                await logsChannel.send({ embeds: [embed] })

                Logger.log('Clips', 'INFO', `${uploadedClipsCount} clip(s) uploadé(s)`)
            }
        } catch(error) {
            throw new TwitchError(error.message)
        }
    }

    /**
     * Récupération d'un clip depuis un lien de clip Twitch
     * @param url lien vers le clip Twitch
     */
    private static async getClipByUrl(url: string): Promise<boolean> {
        try {
            let file: tmp.FileResult
            let title: string
            let broadcasterName: string

            if(!url.includes('https://www.twitch.tv/videos/')) {
                const slug = url.substring(url.lastIndexOf('/') + 1, url.length)
                const clipInfos = await this.getClipInfos(slug)
                title = clipInfos.clip.title
                broadcasterName = clipInfos.clip.broadcaster.displayName
                const downloadUrl = await this.getClipDownloadUrl(slug)
                file = await this.downloadClip(downloadUrl)
            } else {
                const videoId = url.substring(url.lastIndexOf('/') + 1, url.length)
                const videoInfos = await this.getVideoInfos(videoId)
                title = videoInfos.video.title
                broadcasterName = videoInfos.video.creator.login
                file = await this.downloadVideo(videoId)
            }

            try {
                title = title.replace(/[<>:"\/\\|?*]/g, '')
                const fileName = `${title}.mp4`
                const folderName = 'Twitch-' + broadcasterName

                const newFolder = await nextcloud.createFolder(`${config.twitch.clipsLocation}/${folderName}`)
                await nextcloud.uploadFile(file.name, `${newFolder.name}/${fileName}`)
                file.removeCallback()
            } catch(error) {
                file.removeCallback()
                if(error.name === 'NEXTCLOUD_ERROR') {
                    throw new TwitchError(error.message)
                }
            }

            return true
        } catch(error) {
            if(error.name === 'TWITCH_ERROR') {
                Logger.log('Clips', 'ERROR', error.message)
                return false
            } else {
                throw new TwitchError(error.message)
            }
        }
    }

    /**
     * Récupération d'un clip depuis une pièce jointe à un message Discord
     * @param attachment pièce jointe d'un message Discord
     * @param memberId identifiant du membre Discord ayant uploadé le clip
     */
    private static async getClipByAttachment(attachment: Attachment, memberId: string): Promise<boolean> {
        try {
            const file = await this.downloadClip(attachment.url)

            try {
                const hash = crypto.randomBytes(Math.ceil(10 / 2)).toString('hex').slice(0, 10)
                const fileName = `${this.convertDate(new Date())}_${hash}`
                const folderName = 'Discord-' + memberId

                const newFolder = await nextcloud.createFolder(`${config.twitch.clipsLocation}/${folderName}`)
                await nextcloud.uploadFile(file.name, `${newFolder.name}/${fileName}.mp4`)
                file.removeCallback()
            } catch(error) {
                file.removeCallback()
                if(error.name === 'NEXTCLOUD_ERROR') {
                    throw new TwitchError(error.message)
                }
            }

            return true
        } catch(error) {
            if(error.name === 'TWITCH_ERROR') {
                Logger.log('Clips', 'WARNING', error.message)
                return false
            } else {
                throw new TwitchError(error.message)
            }
        }
    }

    /**
     * Récupération des informations d'un clip
     * @param ClipSlug identifiant du clip
     * @returns informations du clip
     */
    private static async getClipInfos(ClipSlug: string): Promise<ClipInfosData> {
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

            return clipInfos.data
        } else {
            throw new TwitchError('Récupération des informations du clip impossible')
        }
    }

    /**
     * Récupère le lien de téléchargement d'un clip
     * @param clipSlug identifiant du clip
     * @returns lien de téléchargement du clip
     */
    private static async getClipDownloadUrl(clipSlug: string): Promise<string> {
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
    }

    /**
     * Télécharge un clip vers un fichier temporaire
     * @param url url du fichier à télécharger
     * @returns fichier temporaire téléchargé
     */
    private static async downloadClip(url: string) {
        const tmpFile = tmp.fileSync()

        try {
            const response = await fetch(url)
            const file = await response.arrayBuffer()
            const buffer = Buffer.from(file)

            await new Promise((resolve, reject) => {
                fs.writeFile(tmpFile.name, buffer, (err) => {
                    if(err) reject(err)
                    resolve(null)
                })
            })

            return tmpFile
        } catch(error) {
            tmpFile.removeCallback()
            throw new TwitchError('Échec de téléchargement du clip')
        }
    }

    /**
     * Récupération du token d'une VOD
     * @param videoId identifiant de la VOD
     * @returns token de la VOD
     */
    private static async getVideoToken(videoId: string): Promise<VODTokenData> {
        const videoTokenRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify({"operationName":"PlaybackAccessToken_Template","query":"query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) { streamPlaybackAccessToken(channelName: $login, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isLive) { value signature __typename } videoPlaybackAccessToken(id: $vodID, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isVod) { value signature __typename }}", "variables": {"isLive":false,"login":"","isVod":true,"vodID":videoId,"playerType":"site"}})
        })

        const videoToken = await videoTokenRequest.json()
        return videoToken.data
    }

    /**
     * Récupération de la liste des chunks constituants une VOD
     * @param videoId identifiant de la VOD
     * @param token token de la VOD
     * @param sig signature de la VOD
     * @returns liste des chunks constituants la VOD
     */
    private static async getVideoPlaylist(videoId: string, token: string, sig: string) {
        const params = new URLSearchParams({
            nauth: token,
            nauthsig: sig,
            allow_source: 'true',
            player: 'twitchweb'
        }).toString()

        const videoPlaylistRequest = await fetch(`http://usher.ttvnw.net/vod/${videoId}?${params}`, {
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
    }

    /**
     * Récupération d'un fichier playlist contenant la liste des chunks constituants une VOD
     * @param videoId identifiant de la VOD
     * @returns URL du fichier playlist
     */
    private static async getRestrictedVideoPlaylist(videoId: string) {
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
    }

    /**
     * Récupération des informations d'une VOD
     * @param videoId identifiant de la VOD
     * @returns informations de la VOD
     */
    private static async getVideoInfos(videoId: string): Promise<VODInfosData> {
        const videoInfosRequest = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-ID': twitchGqlClientId
            },
            body: JSON.stringify({"query":"query{video(id:\"" + videoId + "\"){title,createdAt,creator{login}}}","variables":{}})
        })

        if(videoInfosRequest.ok) {
            const videoInfos = await videoInfosRequest.json()

            if(!videoInfos.data.video) {
                throw new TwitchError('La vidéo demandée n\'existe pas')
            }

            return videoInfos.data
        } else {
            throw new TwitchError('Récupération des informations de la vidéo impossible')
        }
    }

    /**
     * Téléchargement d'un chunk d'une VOD
     * @param url URL de téléchargement du chunk
     * @param path chemin vers le fichier de destination
     */
    private static async downloadChunk(url: string, path: string) {
        const downloadRequest = await fetch(url, {
            method: 'GET'
        })

        if(downloadRequest.ok) {
            const fileStream = fs.createWriteStream(path)

            await new Promise((resolve, reject) => {
                if(downloadRequest.body) {
                    downloadRequest.body.pipeTo(new WritableStream({
                        write(chunk) {
                            fileStream.write(chunk)
                        },
                        close() {
                            resolve(null)
                        }
                    }))
                }
            })
        } else {
            throw new Error(JSON.stringify({
                status: downloadRequest.status,
                statusText: downloadRequest.statusText
            }))
        }
    }

    /**
     * Téléchargement d'une VOD
     * @param videoId identifiant de la VOD à télécharger
     * @returns fichier téléchargé
     */
    private static async downloadVideo(videoId: string): Promise<tmp.FileResult> {
        const videoToken = await this.getVideoToken(videoId)
        const videoPlaylistRaw = await this.getVideoPlaylist(videoId, videoToken.videoPlaybackAccessToken.value, videoToken.videoPlaybackAccessToken.signature)
        
        let vodAge = 25
        let playlistUrl: string
        if(videoPlaylistRaw) {
            const videoPlaylist = videoPlaylistRaw.split('\n')
            playlistUrl = videoPlaylist[videoPlaylist.findIndex(vp => vp.includes('#EXT-X-MEDIA')) + 2]
        } else {
            playlistUrl = await this.getRestrictedVideoPlaylist(videoId)
        }

        const baseUrl = playlistUrl.substring(0, playlistUrl.lastIndexOf('/') + 1)
        
        const videoChunksRequest = await fetch(playlistUrl, {
            method: 'GET'
        })
        const videoChunksResponse = await videoChunksRequest.text()
        const videoChunks = videoChunksResponse.split('\n')

        const tdtg = videoChunks.find(vc => vc.includes('#ID3-EQUIV-TDTG:'))
        if(tdtg) {
            const vodDate = tdtg.replace('#ID3-EQUIV-TDTG:', '')
            vodAge = Math.round((new Date().getTime() - new Date(vodDate).getTime()) / 3600000)
        }

        const videoList: {key: string, value: number}[] = []
        for(let i = 0; i < videoChunks.length; i++) {
            if(videoChunks[i].includes('#EXTINF')) {
                if(videoChunks[i + 1].includes('#EXT-X-BYTERANGE')) {
                    if(videoList.find(vl => vl.key === videoChunks[i + 2])) {
                        const pair = videoList.find(vl => vl.key === videoChunks[i + 2])
                        if(pair) pair.value += parseFloat(videoChunks[i].substring(8, videoChunks[i].length - 1))
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

        const limit = pLimit(10)
        const tmpChunks = await Promise.all(videoList.map(async (video) => {
            return await limit(async () => {
                let isDone = false
                let tryUnmute = vodAge < 24
                tryUnmute = true
                let errorCount = 0

                const fileName = video.key.includes('?') ? video.key.split('?')[0] : video.key
                const tmpChunk = tmp.fileSync({ name: `${videoId}-${fileName}` })

                while(!isDone && errorCount < 10) {
                    try {
                        if(tryUnmute && video.key.includes('-muted')) {
                            await this.downloadChunk(baseUrl + video.key.replace('-muted', ''), tmpChunk.name)
                        } else {
                            await this.downloadChunk(baseUrl + video.key, tmpChunk.name)
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
                    limit.clearQueue()
                    tmpChunk.removeCallback()
                    throw new TwitchError('Échec du téléchargement de la VOD')
                } else {
                    return tmpChunk
                }
            })
        }))

        const outputTmp = tmp.fileSync({ name: `${videoId}-output.ts` })
        const outputStream = fs.createWriteStream(outputTmp.name)
        for(const video of videoList) {
            const fileName = video.key.includes('?') ? video.key.split('?')[0] : video.key
            const tmpChunk = tmpChunks.find(c => path.basename(c.name) === `${videoId}-${fileName}`)
            if(tmpChunk && fs.existsSync(tmpChunk.name)) {
                const inputStream = fs.createReadStream(tmpChunk.name)
                await new Promise(resolve => {
                    inputStream.pipe(outputStream, { end: false })
                    inputStream.on('end', () => {
                        resolve(null)
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
                .on('error', (err) => {
                    outputConvertedTmp.removeCallback()
                    outputTmp.removeCallback()
                    reject()
                })
        })
    }

    /**
     * Recherche les membres en live sur Twitch et envoie une notification dans le salon #twitch-youtube
     * @param client client Discord
     */
    static async live(client: Client) {
        try {
            const gameId = '503116'
            const accessToken = await this.getToken()
            
            if(accessToken) {
                const streamers = await TwitchModel.findAll()

                const users = new URLSearchParams()
                for(const streamer of streamers) {
                    users.append('user_login', streamer.channelName)
                }

                try {
                    const streaming: StreamData[] = await new Promise(async (resolve, reject) => {
                        const streams = []
                        let after = null

                        do {
                            const streamsRequest: Response = await fetch(`https://api.twitch.tv/helix/streams?${after ? `after=${after}&` : ''}first=50&${users.toString()}`, {
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
                            const thumbnailUrl = user.thumbnail_url.replace('{width}', '1280').replace('{height}', '720') + '?c=' + (new Date()).getTime()

                            const guild = <Guild>client.guilds.cache.get(config.guild.id)
                            const member = <GuildMember>guild.members.cache.get(streamer.memberId)
                            const twitchChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['twitch-youtube'])

                            const embed = new Embed()
                                .setColor('#6441A5')
                                .setTitle(`${member.displayName} est en live !`)
                                .setDescription(`${hyperlink(title, `https://www.twitch.tv/${userLogin}`)}`)
                                .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
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

                                Logger.log('Twitch', 'INFO', `${member.user.username} est en live !`)
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
            if(error.name === 'TWITCH_ERROR') {
                Logger.log('Twitch', 'ERROR', error.message)
            } else {
                throw new TwitchError(error.message)
            }
        }
    }

    /**
     * Lie un compte Twitch à un membre Discord
     * @param memberId identifiant du membre Discord auquel lier à un compte Twitch
     * @param channelName nom de la chaîne Twitch à lier au membre Discord
     */
    static async link(memberId: string, channelName: string) {
        const streamer = await TwitchModel.findOne({ where: { memberId: memberId } })

        if(streamer) {
            streamer.channelName = channelName
            streamer.live = false
            streamer.messageId = ''
            streamer.save()
        } else {
            await TwitchModel.create({
                memberId: memberId,
                channelName: channelName,
                live: false,
                messageId: ''
            })
        }
    }

    /**
     * Délie un compte Twitch d'un membre Discord
     * @param memberId identifiant du membre Discord pour lequel délier un compte Twitch
     */
    static async unlink(memberId: string) {
        await TwitchModel.destroy({ where: { memberId: memberId } })
    }

    /**
     * Convertit une date au format yyyy-mm-dd hh:ii
     * @param date date à convertir
     * @returns date convertie
     */
    private static convertDate(date: Date) {
        const year = date.getFullYear()
        const month = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
        const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()

        return `${year}-${month}-${day} ${hours}:${minutes}`
    }
}