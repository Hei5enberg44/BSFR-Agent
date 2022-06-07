const { Client, Message, MessageAttachment } = require('discord.js')
const Embed = require('../utils/embed')
const { hyperlink } = require('@discordjs/builders')
const { TwitchError, NextcloudError } = require('../utils/error')
const { Twitch } = require('./database')
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
                            const thumbnailUrl = user.thumbnail_url.replace('{width}', 1280).replace('{height}', 720)

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