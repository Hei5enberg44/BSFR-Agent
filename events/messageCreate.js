import { Message, userMention } from 'discord.js'
import crypto from 'crypto'
import maliciousURL from '../controllers/maliciousURL.js'
import threads from '../controllers/threads.js'
import antivirus from '../controllers/antivirus.js'
import twitch from '../controllers/twitch.js'
import { Feur } from '../controllers/database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Emitted whenever a message is created
     * @param {Message} message The created message
     */
    async execute(message) {
        if(message) {
            if(message.guildId) {
                // Si ce n'est pas un dm
                await this.feur(message)
                await this.feurLeaderboard(message)

                // Test si un URL malveillant a été envoyé
                if(message.content.match(/https?:\/\//)) {
                    await maliciousURL.test(message)
                }

                // Récéption d'un webhook dans le channel #vote-run-bsfr
                if(message.channel.id === config.guild.channels.voteRun && message.webhookId) {
                    await this.voteRunReactions(message)
                }

                // Récupération des clips Twitch
                if(message.channel.id === config.guild.channels.clips) {
                    try {
                        await twitch.getClip(message)
                    } catch(error) {
                        Logger.log('Clips', 'ERROR', 'Récupération du clip impossible : ' + error.message)
                    }
                }
            } else {
                // Si c'est un dm
                await this.dm(message)
            }

            // Scan antivirus des pièces jointes du message
            if(message.attachments.size > 0 && !message.author.bot) {
                try {
                    await antivirus.scanFiles(message)
                } catch(error) {
                    Logger.log('Antivirus', 'ERROR', 'Scan impossible : ' + error.message)
                }
            }
        }
    },

    /**
     * Ajout des réactions ✅ et ❎ à l'embed d'une soumission de run
     * @param {Message} message message Discord
     */
    async voteRunReactions(message) {
        await message.react('✅')
        await message.react('❎')
    },

    /**
     * Répond "feur" si "quoi" est détécté en fin de phrase
     * (crédit: Vred#0001)
     * @param {Message} message The created message
     */
    async feur(message) {
        const random = crypto.randomInt(15)
        if(message.content.match(/[cqk]+(?:[uúùûü]*w+[uúùûü]*[aáàâäãå]+|[uúùûü]*[eéèêë]*[oóòôöõ]+[iíìîïaáàâäãå]+|[oóòôöõ]+[uúùûü]+[aáàâäãå]+)/igm) && random === 0) {
            message.reply({ content: 'feur', allowedMentions: { repliedUser: false } })
            Logger.log('Feur', 'INFO', `Agent a répondu "feur" à ${message.author.tag}`)
        }
    },

    /**
     * Enregistre les réponses "feur" à des messages contenant "quoi" dans la base de données
     * @param {Message} message The created message
     */
    async feurLeaderboard(message) {
        const regex = new RegExp(/[cqk]+(?:[uúùûü]*w+[uúùûü]*[aáàâäãå]+|[uúùûü]*[eéèêë]*[oóòôöõ]+[iíìîïaáàâäãå]+|[oóòôöõ]+[uúùûü]+[aáàâäãå]+)/, 'igm')
        const exceptions = [ 'aquoibonisme', 'aquoibonismes', 'aquoiboniste', 'aquoibonistes', 'carquois', 'claquoir', 'claquoirs', 'dacquois', 'dacquoise', 'dacquoises', 'dunkerquois', 'dunkerquoise', 'dunkerquoises', 'iroquoien', 'iroquoienne', 'iroquoiennes', 'iroquoiens', 'iroquois', 'iroquoise', 'iroquoises', 'lucquois', 'lucquoise', 'lucquoises', 'marquoir', 'marquoirs', 'narquois', 'narquoise', 'narquoisement', 'narquoises', 'piquoir', 'piquoirs', 'pourquoi', 'quoi', 'quoique', 'rufisquois', 'rufisquoise', 'rufisquoises', 'sequoia', 'sequoias', 'taquoir', 'taquoirs', 'turquoise', 'turquoises' ]

        const isException = word => {
            if(word.length > 6 && word.length < 15 && exceptions.find(e => e === word)) 
                return true
            return false
        }

        const messageSplit = message.content.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
        if(message.reference && messageSplit.includes('feur')) {
            const channelReference = message.guild.channels.cache.find(c => c.id === message.reference.channelId)
            const messageReference = await channelReference.messages.fetch(message.reference.messageId)

            if(messageReference.author.id === message.author.id || messageReference.createdTimestamp + 86400000 < Date.now()) return false

            const sentence = messageReference.content.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '')

            let match
            while((match = regex.exec(sentence)) !== null) {
                let startIndex = sentence.substring(0, match.index).lastIndexOf(' ') + 1
                if(startIndex === 0) startIndex = 0

                let endIndex = regex.lastIndex + sentence.substring(regex.lastIndex).indexOf(' ') + 1
                if(endIndex === regex.lastIndex) endIndex = sentence.length

                const word = sentence.substring(startIndex, endIndex).trim()
                if(!isException(word)) {
                    const feured = await Feur.findOne({
                        where: {
                            victimId: messageReference.author.id,
                            messageId: messageReference.id
                        }
                    })

                    if(!feured) {
                        await Feur.create({
                            attackerId: message.author.id,
                            victimId: messageReference.author.id,
                            messageId: messageReference.id,
                            message: messageReference.content,
                            messageDate: new Date(messageReference.createdTimestamp),
                            responseId: message.id,
                            response: message.content,
                            responseDate: new Date(message.createdTimestamp)
                        })
                    }
                }
            }
        }
    },

    /**
     * Récéption d'un message privé
     * @param {Message} message The created message
     */
    async dm(message) {
        if(message.author.id !== config.clientId) {
            const guild = message.client.guilds.cache.get(config.guild.id)
            const agentDmChannel = guild.channels.cache.get(config.guild.channels.agentDm)

            const createdThread = await threads.get('dm', null, message.author.id)

            let thread
            if(!createdThread) {
                thread = await agentDmChannel.threads.create({
                    name: message.author.username,
                    autoArchiveDuration: 1440,
                    reason: 'DM de ' + message.author.tag
                })

                if(!thread.id) {
                    Logger.log('DM', 'ERROR', `Échec de la création du thread ${message.author.username}`)
                    await agentDmChannel.send({ content: `Impossible de créer le thread\n${userMention(message.author.id)}: ${message.content}` })
                } else {
                    Logger.log('DM', 'INFO', `Thread "${message.author.username}" créé`)

                    const adminsList = guild.roles.cache.get(config.guild.roles["Admin"]).members
                    const modosList = guild.roles.cache.get(config.guild.roles["Modérateur"]).members

                    const members = adminsList.concat(modosList)

                    for(const [, member] of members) {
                        Logger.log('DM', 'INFO', `Ajout de ${member.user.tag} au nouveau thread`)
                        await thread.members.add(member.user.id)
                    }

                    await threads.add('dm', thread.id, message.author.id)
                }
            } else {
                thread = await agentDmChannel.threads.fetch(createdThread.threadId)

                if(thread) {
                    Logger.log('DM', 'INFO', `Thread "${message.author.username}" trouvé`)
                } else {
                    Logger.log('DM', 'ERROR', `Thread "${message.author.username}" introuvable`)
                }
            }

            if(thread) {
                if(thread.archived) await thread.setArchived(false)
                if(thread.locked) await thread.setLocked(false)

                await thread.send({ content: `${userMention(message.author.id)}: ${message.content}` })
            }
        }
    }
}