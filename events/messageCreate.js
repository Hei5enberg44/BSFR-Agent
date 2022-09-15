import { Message, userMention } from 'discord.js'
import crypto from 'crypto'
import maliciousURL from '../controllers/maliciousURL.js'
import threads from '../controllers/threads.js'
import antivirus from '../controllers/antivirus.js'
import twitch from '../controllers/twitch.js'
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
        if(message.content.match(/(^|.+\s)quoi(\s\?|\?)?$/i) && random === 0) {
            message.reply({ content: 'feur', allowedMentions: { repliedUser: false } })
            Logger.log('Feur', 'INFO', `Agent a répondu "feur" à ${message.author.tag}`)
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