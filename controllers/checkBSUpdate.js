import { Client, roleMention } from 'discord.js'
import puppeteer from 'puppeteer'
import fetch from 'node-fetch'
import { BSUpdates } from './database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * @typedef {Object} UpdateData
     * @property {Buffer|null} image
     * @property {string|null} title
     * @property {string|null} content
     */

    /**
     * Récupération des informations sur la dernière mise à jour de Beat Saber
     * @returns {Promise<UpdateData|null>} informations sur la mise à jour
     */
    async getLastUpdate() {
        const oculusUrl = 'https://www.oculus.com'
        const beatsaberPath = '/experiences/rift/1304877726278670/'

        const browser = await puppeteer.launch()

        try {
            const page = await browser.newPage()
            await page.goto(oculusUrl + beatsaberPath)

            await page.waitForSelector('a.devpost-tile', {
                timeout: 10000
            })

            const lastDevPostPath = await page.evaluate(() => {
                const devPosts = document.body.querySelectorAll('a.devpost-tile')
                if(devPosts[0]) return devPosts[0].getAttribute('href')
                return null
            })

            let updateInfos = null

            if(lastDevPostPath) {
                await page.goto(oculusUrl + lastDevPostPath)

                updateInfos = await page.evaluate(() => {
                    const formatText = (text) => text.replace(/([\*\|_-])/g, '\\$1')

                    const infos = {
                        image: null,
                        title: null,
                        content: null
                    }

                    const imageContainer = document.body.querySelector('._9cqr')
                    if(imageContainer) infos.image = imageContainer.src

                    const titleContainer = document.body.querySelector('._9cq4')
                    if(titleContainer) infos.title = `**${formatText(titleContainer.textContent)}**`

                    const contentContainer = document.body.querySelector('[data-contents="true"]')
                    if(contentContainer) {
                        const content = []
                        for(const child of contentContainer.children) {
                            if(child.tagName === 'UL') {
                                const listItems = child.querySelectorAll('li')
                                for(const li of listItems) {
                                    let textContent = formatText(li.textContent)
                                    if(li.style.fontWeight === 'bold') textContent = `**${textContent}**`
                                    if(li.style.fontStyle === 'italic') textContent = `*${textContent}*`
                                    textContent = li.classList.contains('_3kq1') ? `• ${textContent}` : `    ○ ${textContent}`
                                    content.push(textContent)
                                }
                            } else if(child.tagName === 'DIV') {
                                const spans = child.querySelector('div')?.children
                                if(spans) {
                                    let textContent = ''
                                    for(const span of spans) {
                                        if(span.tagName === 'A') {
                                            textContent += span.getAttribute('href')
                                        } else {
                                            textContent += formatText(span.textContent)
                                            if(span.style.fontWeight === 'bold') textContent = `**${textContent}**`
                                            if(span.style.fontStyle === 'italic') textContent = `*${textContent}*`
                                        }
                                    }
                                    content.push(textContent)
                                }
                            }
                        }
                        infos.content = content.join('\n')
                    }
                    return infos
                })
            }

            await browser.close()

            if(updateInfos.title) {
                const newUpdate = await BSUpdates.findOne({
                    where: {
                        title: updateInfos.title
                    }
                })

                if(updateInfos.image) {
                    try {
                        const imageRequest = await fetch(updateInfos.image)
                        if(!imageRequest.ok) throw new Error('Récupération de l\'image impossible')
                        const image = await imageRequest.arrayBuffer()
                        updateInfos.image = Buffer.from(image)
                    } catch(err) {
                        updateInfos.image = null
                    }
                }

                if(!newUpdate) {
                    Logger.log('BSUpdate', 'INFO', 'Nouvelle mise à jour de Beat Saber')
                    await BSUpdates.create(updateInfos)
                    return updateInfos
                }
            }

            return null
        } catch(error) {
            await browser.close()
            console.log(error)
            Logger.log('BSUpdate', 'ERROR', 'Une erreur est survenue lors de la récupération des mises à jour')
            return null
        }
    },

    /**
     * Publie le contenu de la mise à jour dans le channel #bs-updates
     * @param {Client} client client Discord
     * @param {UpdateData} update contenu de la mise à jour
     */
    async postUpdate(client, update) {
        const guild = client.guilds.cache.get(config.guild.id)
        const updateChannel = guild.channels.cache.get(config.guild.channels.bsUpdates)

        if(update.title && update.content) await updateChannel.send({ content: roleMention(config.guild.roles['Beat Saber Update']) })

        if(update.image) await updateChannel.send({ files: [update.image] })
        if(update.title) await updateChannel.send({ content: update.title })
        if(update.content) {
            let message = []
            const content = update.content.split('\n')
            for(let i = 0; i < content.length; i++) {
                message.push(content[i])
                if(message.join('\n').length + content[i].length >= 1500 || i === content.length - 1) {
                    await updateChannel.send({ content: message.join('\n') })
                    message = []
                }
            }
        }
    }
}