import { Client, Guild, TextChannel, Message, MessageFlags, roleMention, ChannelType } from 'discord.js'
import { BSUpdateModel } from './database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

const apiUrl = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=620980&count=1&maxlength=0&format=json'
const STEAM_CLAN_IMAGE = 'https://clan.cloudflare.steamstatic.com/images'

interface AppNews {
    appnews?: NewsItems
}

interface NewsItems {
    newsitems?: NewItem[]
}

interface NewItem {
    title: string,
    contents: string,
    feed_type: number
}

export default {
    /**
     * Récupération des informations sur la dernière mise à jour de Beat Saber
     * @returns informations sur la mise à jour
     */
    async getLastUpdate() {
        const newsRequest = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if(newsRequest.ok) {
            const news: AppNews = await newsRequest.json()
            const newsItems = news?.appnews?.newsitems

            if(newsItems) {
                const lastNews = newsItems[0]

                if(lastNews.feed_type === 1) {
                    const updateTitle = `## ${lastNews.title}`

                    let contents = lastNews.contents
                    contents = contents.replace(/\[p\]/g, '')
                    contents = contents.replace(/\[\/p\]/g, '\n')

                    let image
                    let contentsArray = []
                    for(let line of contents.split('\n')) {
                        if(line.match(/STEAM_CLAN_(LOC_)?IMAGE/)) {
                            if(!image) {
                                if(line.match(/\[img\]\{STEAM_CLAN_(LOC_)?IMAGE\}.+\[\/img\]/)) {
                                    image = line.replace(/\[img\]\{STEAM_CLAN_(?:LOC_)?IMAGE\}(.+)\[\/img\]/, `${STEAM_CLAN_IMAGE}$1`)
                                } else if(line.match(/\[img src=\"{STEAM_CLAN_(LOC_)?IMAGE\}[^\"]+\"\]\[\/img\]/)) {
                                    image = line.replace(/\[img src=\"{STEAM_CLAN_(?:LOC_)?IMAGE\}([^\"]+)\"\]\[\/img\]/, `${STEAM_CLAN_IMAGE}$1`)
                                }
                            }
                            continue
                        }
                        line = line.replace(/\[\/?list\]/g, '')
                        line = line.replace(/\[\/\*\]/g, '')
                        line = line.replace(/\[previewyoutube=([a-zA-Z0-9-_]+)(?:;[a-z]+)?\]\[\/previewyoutube\]/g, 'https://youtu.be/$1')
                        line = line.replace(/\[b\](.+)\[\/b\]/g, '**$1**')
                        line = line.replace(/\[i\](.+)\[\/i\]/g, '*$1*')
                        line = line.replace(/\[u\](.+)\[\/u\]/g, '__$1__')
                        line = line.replace(/\[spoiler\](.+)\[\/spoiler\]/g, '||$1||')
                        line = line.replace(/\[url=(.+)\](.+)\[\/url\]/g, '$2: $1')
                        line = line.replace(/\[\*\]/g, ' - ')
                        contentsArray.push(line)
                    }

                    const updateContent = contentsArray.join('\n')

                    if(lastNews.title) {
                        const newUpdate = await BSUpdateModel.findOne({
                            where: {
                                title: updateTitle
                            }
                        })

                        let updateImage

                        if(image) {
                            try {
                                const imageRequest = await fetch(image)
                                if(!imageRequest.ok) throw new Error('Récupération de l\'image impossible')
                                const imageData = await imageRequest.arrayBuffer()
                                updateImage = Buffer.from(imageData)
                            } catch(err) {
                                updateImage = null
                            }
                        }

                        const updateData = {
                            image: updateImage,
                            title: updateTitle,
                            content: updateContent
                        }

                        if(!newUpdate) {
                            Logger.log('BSUpdate', 'INFO', 'Nouvelle mise à jour de Beat Saber')
                            const BSUpdate = await BSUpdateModel.create(updateData)
                            return BSUpdate
                        }
                    }
                }
            }
        }

        return null
    },

    /**
     * Publie le contenu de la mise à jour dans le salon #bs-updates
     * @param client client Discord
     * @param update contenu de la mise à jour
     */
    async postUpdate(client: Client, update: BSUpdateModel) {
        const guild = <Guild>client.guilds.cache.get(config.guild.id)
        const updateChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['bs-updates'])

        if(update.title && update.content) {
            await updateChannel.send({ content: roleMention(config.guild.roles['Beat Saber Update']) })

            if(update.image) {
                const m = await updateChannel.send({ files: [update.image] })
                await this.publish(m)
            }

            let message = []
            message.push(update.title)
            const content = update.content.split('\n')
            for(let i = 0; i < content.length; i++) {
                message.push(content[i])
                if(message.join('\n').length + content[i].length >= 1500 || i === content.length - 1) {
                    const m = await updateChannel.send({ content: message.join('\n'), flags: MessageFlags.SuppressEmbeds })
                    await this.publish(m)
                    message = []
                }
            }
        }
    },

    async publish(message: Message) {
        if(message.channel.type === ChannelType.GuildAnnouncement) {
            try {
                await message.crosspost()
            } catch(err) {}
        }
    }
}