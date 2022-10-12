import { Message, bold, inlineCode, userMention, roleMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { AntivirusError } from '../utils/error.js'
import fetch, { FormData, fileFrom } from 'node-fetch'
import tmp from 'tmp'
import * as fs from 'node:fs'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

const wait = (s) => new Promise((res) => setTimeout(res, s * 1000))

export default {
    /**
     * @typedef {Object} ScanStats
     * @property {number} failure
     * @property {number} harmless
     * @property {number} malicious
     * @property {number} suspicious
     * @property {number} timeout
     * @property {number} undetected
     */

    /**
     * Scan antivirus d'un fichier
     * @param {string} url lien vers le fichier
     * @returns {Promise<{data:{attributes:{stats:ScanStats}}}>} résultat de l'analyse
     */
    async scan(url) {
        try {
            const apiKey = config.antivirus.apiKey

            const file = await this.download(url)

            const form = new FormData()
            form.set('file', await fileFrom(file.name))

            const fileScan = await fetch('https://www.virustotal.com/api/v3/files', {
                method: 'POST',
                body: form,
                headers: { 'x-apikey': apiKey }
            })

            file.removeCallback()

            if(!fileScan.ok) throw new AntivirusError(`Échec de l'envoi du fichier pour analyse (url: ${url})`)

            const fileScanResponse = await fileScan.json()
            const fileScanId = fileScanResponse.data.id

            let error = false
            let status = 'queued'
            let fileAnalysisResponse

            do {
                await wait(5)

                const fileAnalysis = await fetch(`https://www.virustotal.com/api/v3/analyses/${fileScanId}`, {
                    method: 'GET',
                    headers: { 'x-apikey': apiKey }
                })

                if(fileAnalysis.ok) {
                    fileAnalysisResponse = await fileAnalysis.json()
                    status = fileAnalysisResponse.data.attributes.status
                } else {
                    error = true
                }
            } while(status !== 'completed' && !error)

            if(error) throw new AntivirusError(`Échec de l'analyse du fichier (url: ${url})`)

            return fileAnalysisResponse
        } catch(error) {
            throw new AntivirusError(error.message)
        }
    },

    /**
     * Scan antivirus de fichiers
     * @param {Message} message The created message
     */
    async scanFiles(message) {
        const attachments = message.attachments
        for(const [, attachment] of attachments.entries()) {
            const contentType = attachment.contentType
            if(!contentType || !contentType.match(/(image|video|audio)/i)) {
                Logger.log('Antivirus', 'INFO', `Scan d'un fichier envoyé par ${message.member.user.tag}`)

                let reaction = await message.react('🔄')

                try {
                    const url = attachment.url
                    const scanResult = await this.scan(url)
                
                    const stats = scanResult.data.attributes.stats
                    if(stats.harmless + stats.undetected > stats.malicious + stats.suspicious) {
                        Logger.log('Antivirus', 'INFO', `Résultat du scan : Fichier OK`)

                        try {
                            await reaction.remove()
                            reaction = await message.react('✅')
                        } catch(error) {}
                    } else {
                        Logger.log('Antivirus', 'WARNING', `Résultat du scan : Menace détéctée`)

                        try {
                            await message.delete()
                        } catch(error) {}

                        const warningMessage = await message.channel.send({ content: `❗ ${bold('Le fichier ' + inlineCode(attachment.name) + ' envoyé par ' + userMention(message.author.id) + ' est infecté ❗')}\nSi l'un d'entre vous a téléchargé ce fichier, nous vous recommandons fortement de supprimer ce dernier ainsi que d'effectuer une analyse anti-virus.` })

                        const logsChannel = message.guild.channels.cache.get(config.guild.channels.logs)
                        const muteRole = message.guild.roles.cache.get(config.guild.roles['Muted'])

                        const embeds = []

                        embeds.push(new Embed()
                            .setColor('#E74C3C')
                            .setTitle('❗ Fichier infecté')
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .addFields(
                                { name: 'Le méchant', value: userMention(message.author.id), inline: true },
                                { name: 'Nom du fichier', value: attachment.name, inline: true }
                            ))

                        try {
                            await message.author.send({ content: `${bold('[BSFR]')}\n\nLe fichier que tu as uploadé ${inlineCode(attachment.name)} est infecté.\nIl a été supprimé et tu as été mute.\nUn membre du staff te contactera rapidement.` })
                        } catch(error) {
                            embeds.push(new Embed()
                                .setColor('#E74C3C')
                                .setDescription('Le message n\'a pas pu être envoyé au membre'))
                        }

                        await logsChannel.send({ content: roleMention(config.guild.roles['Modérateur']), embeds: embeds })

                        await message.member.roles.add(muteRole)

                        // On supprime le message d'avertissement au bout de 15 minutes
                        setTimeout(async () => {
                            try {
                                await warningMessage.delete()
                            } catch(error) {}
                        }, 900000)
                    }
                } catch(error) {
                    try {
                        await reaction.remove()
                        await message.react('⚠')
                    } catch(error) {}

                    if(error instanceof AntivirusError) {
                        Logger.log('Antivirus', 'ERROR', error.message)
                    } else {
                        throw new AntivirusError(error.message)
                    }
                }
            }
        }
    },

    /**
     * Téléchargement du fichier
     * @param {string} url lien vers le fichier
     * @returns {Promise<tmp.FileResult>} fichier temporaire téléchargé
     */
    async download(url) {
        const tmpFile = tmp.fileSync()

        try {
            const response = await fetch(url)
            const file = await response.arrayBuffer()
            const buffer = Buffer.from(file)

            await new Promise((resolve, reject) => {
                fs.writeFile(tmpFile.name, buffer, (err) => {
                    if(err) reject(err)
                    resolve()
                })
            })

            return tmpFile
        } catch(error) {
            tmpFile.removeCallback()
            throw new AntivirusError('Échec de téléchargement du fichier')
        }
    }
}