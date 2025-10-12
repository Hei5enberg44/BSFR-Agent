import {
    Guild,
    Message,
    Role,
    TextChannel,
    ThreadChannel,
    ThreadAutoArchiveDuration,
    userMention
} from 'discord.js'
import maliciousURL from '../controllers/maliciousURL.js'
import threads from '../controllers/threads.js'
import twitch from '../controllers/twitch.js'
import feur from '../controllers/feur.js'
import cooldown from '../controllers/cooldown.js'
import settings from '../controllers/settings.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default class messageCreate {
    private static message: Message

    /**
     * Emitted whenever a message is created
     * @param message The created message
     */
    static async execute(message: Message) {
        if (message) {
            this.message = message

            // Si ce n'est pas un dm
            if (message.guildId) {
                // Si le message n'a pas été envoyé par le bot
                if (!message.author.bot) {
                    await feur.feur(message)
                    await cooldown.check(message)

                    // Test si un message est envoyé dans le salon interdit
                    if (
                        message.channel.id ===
                        config.guild.channels['forbidden-channel']
                    ) {
                        const member = message.member
                        if (member) {
                            const isInStaff = member.roles.cache.find((r) =>
                                [
                                    config.guild.roles['Admin'],
                                    config.guild.roles['Modérateur']
                                ].includes(r.id)
                            )
                            if (!isInStaff && member.bannable) {
                                await member.ban({
                                    reason: 'honeypot',
                                    deleteMessageSeconds: 3600
                                })
                                Logger.log(
                                    'Ban',
                                    'INFO',
                                    `${member.user.username} est tombé dans le piège`
                                )
                            }
                        }
                    }

                    // Test si un URL malveillant a été envoyé
                    if (message.content.match(/https?:\/\//)) {
                        await maliciousURL.test(message)
                    }

                    // Récupération des clips Twitch
                    if (message.channel.id === config.guild.channels['clips']) {
                        try {
                            await twitch.getClip(message)
                        } catch (error) {
                            Logger.log(
                                'Clips',
                                'ERROR',
                                `Récupération du clip impossible : ${error.message}`
                            )
                        }
                    }
                } else {
                    // Récéption d'un webhook dans le salon #vote-run-bsfr
                    if (
                        message.channel.id ===
                            config.guild.channels['vote-run-bsfr'] &&
                        message.webhookId
                    ) {
                        await this.voteRunReactions()
                    }
                }
            } else {
                // Si c'est un dm
                await this.dm()
            }
        }
    }

    /**
     * Ajout des réactions ✅ et ❎ à l'embed d'une soumission de run
     */
    private static async voteRunReactions() {
        const message = this.message

        await message.react('✅')
        await message.react('❎')
    }

    /**
     * Récéption d'un message privé
     */
    private static async dm() {
        const message = this.message

        if (message.author.id !== config.clientId) {
            const dmSettings = await settings.get('dm')
            const dmEnabled = dmSettings?.enabled === true

            if (!dmEnabled) return

            const guild = message.client.guilds.cache.get(
                config.guild.id
            ) as Guild
            const agentDmChannel = guild.channels.cache.get(
                config.guild.channels['agent-dm']
            ) as TextChannel

            const createdThread = await threads.get(
                'dm',
                null,
                message.author.id
            )

            let thread: ThreadChannel | null
            if (!createdThread) {
                thread = await agentDmChannel.threads.create({
                    name: message.author.username,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                    reason: `DM de ${message.author.username}`
                })

                if (!thread.id) {
                    Logger.log(
                        'DM',
                        'ERROR',
                        `Échec de la création du thread ${message.author.username}`
                    )
                    await agentDmChannel.send({
                        content: `Impossible de créer le thread\n${userMention(message.author.id)}: ${message.content}`
                    })
                } else {
                    Logger.log(
                        'DM',
                        'INFO',
                        `Thread "${message.author.username}" créé`
                    )

                    const adminsList = (
                        guild.roles.cache.get(
                            config.guild.roles['Admin']
                        ) as Role
                    ).members
                    const modosList = (
                        guild.roles.cache.get(
                            config.guild.roles['Modérateur']
                        ) as Role
                    ).members

                    const members = adminsList.concat(modosList)

                    for (const [, member] of members) {
                        Logger.log(
                            'DM',
                            'INFO',
                            `Ajout de ${member.user.username} au nouveau thread`
                        )
                        await thread.members.add(member.user.id)
                    }

                    await threads.add('dm', thread.id, message.author.id)
                }
            } else {
                thread = await agentDmChannel.threads.fetch(
                    createdThread.threadId
                )

                if (thread) {
                    Logger.log(
                        'DM',
                        'INFO',
                        `Thread "${message.author.username}" trouvé`
                    )
                } else {
                    Logger.log(
                        'DM',
                        'ERROR',
                        `Thread "${message.author.username}" introuvable`
                    )
                }
            }

            if (thread) {
                if (thread.archived) await thread.setArchived(false)
                if (thread.locked) await thread.setLocked(false)

                await thread.send({
                    content: `${userMention(message.author.id)}: ${message.content}`
                })
            }
        }
    }
}
