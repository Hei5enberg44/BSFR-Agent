import { Client, TextChannel, MessageFlags, roleMention } from 'discord.js'
import { BSUpdates } from './database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

const apiUrl = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=620980&count=1&maxlength=0&format=json'
const STEAM_CLAN_IMAGE = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/clans'
const STEAM_CLAN_LOC_IMAGE = 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/clans'

export default {
    /**
     * @typedef {Object} UpdateData
     * @property {string} image
     * @property {string} title
     * @property {Array<string>} content
     */

    /**
     * Récupération des informations sur la dernière mise à jour de Beat Saber
     * @returns {Promise<UpdateData|null>} informations sur la mise à jour
     */
    async getLastUpdate() {
        const updateData = {}

        const newsRequest = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if(newsRequest.ok) {
            const news = await newsRequest.json()
            const newsItems = news?.appnews?.newsitems

            if(newsItems) {
                const lastNews = newsItems[0]
                
                updateData.title = `**${lastNews.title}**`

                let image
                let contents = []
                for(let line of lastNews.contents.split('\n')) {
                    if(line.match(/\[\/?list\]/)) continue
                    if(line.match(/(STEAM_CLAN_IMAGE|STEAM_CLAN_LOC_IMAGE)/)) {
                        if(!image) {
                            image = line.replace(/\[img\]\{STEAM_CLAN_IMAGE\}(.+)\[\/img\]/, `${STEAM_CLAN_IMAGE}$1`)
                            image = image.replace(/\[img\]\{STEAM_CLAN_LOC_IMAGE\}(.+)\[\/img\]/, `${STEAM_CLAN_LOC_IMAGE}$1`)
                        }
                        continue
                    }
                    line = line.replace(/\[previewyoutube=([a-zA-Z0-9-_]+)(?:;[a-z]+)?\]\[\/previewyoutube\]/g, 'https://youtu.be/$1')
                    line = line.replace(/\[b\](.+)\[\/b\]/g, '**$1**')
                    line = line.replace(/\[i\](.+)\[\/i\]/g, '*$1*')
                    line = line.replace(/\[u\](.+)\[\/u\]/g, '__$1__')
                    line = line.replace(/\[spoiler\](.+)\[\/spoiler\]/g, '||$1||')
                    line = line.replace(/\[url=(.+)\](.+)\[\/url\]/g, '$2: $1')
                    line = line.replace(/\[\*\]/g, '•')
                    contents.push(line)
                }

                updateData.image = image
                updateData.content = contents.join('\n')
            }
        }

        if(updateData.title) {
            const newUpdate = await BSUpdates.findOne({
                where: {
                    title: updateData.title
                }
            })

            if(updateData.image) {
                try {
                    const imageRequest = await fetch(updateData.image)
                    if(!imageRequest.ok) throw new Error('Récupération de l\'image impossible')
                    const image = await imageRequest.arrayBuffer()
                    updateData.image = Buffer.from(image)
                } catch(err) {
                    updateData.image = null
                }
            }

            if(!newUpdate) {
                Logger.log('BSUpdate', 'INFO', 'Nouvelle mise à jour de Beat Saber')
                await BSUpdates.create(updateData)
                return updateData
            }
        }
    },

    /**
     * Publie le contenu de la mise à jour dans le channel #bs-updates
     * @param {Client} client client Discord
     * @param {UpdateData} update contenu de la mise à jour
     */
    async postUpdate(client, update) {
        const guild = client.guilds.cache.get(config.guild.id)
        /** @type {TextChannel} */
        const updateChannel = guild.channels.cache.get(config.guild.channels['bs-updates'])

        if(update.title && update.content) await updateChannel.send({ content: roleMention(config.guild.roles['Beat Saber Update']) })

        if(update.image) await updateChannel.send({ files: [update.image] })
        if(update.title) await updateChannel.send({ content: update.title })
        if(update.content) {
            let message = []
            const content = update.content.split('\n')
            for(let i = 0; i < content.length; i++) {
                message.push(content[i])
                if(message.join('\n').length + content[i].length >= 1500 || i === content.length - 1) {
                    await updateChannel.send({ content: message.join('\n'), flags: MessageFlags.SuppressEmbeds })
                    message = []
                }
            }
        }
    }
}