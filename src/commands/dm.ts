import { Guild, Role, SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel, ThreadAutoArchiveDuration, userMention, ThreadChannel, AnyThreadChannel } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import threads from '../controllers/threads.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Sends a private message to a member')
        .setDescriptionLocalization('fr', 'Envoie un message privé à un membre')
        .addUserOption(option =>
            option.setName('member')
                .setNameLocalization('fr', 'membre')
                .setDescription('Member to send a private message to')
                .setDescriptionLocalization('fr', 'Membre à qui envoyer un message privé')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setDescriptionLocalization('fr', 'Massage à envoyer')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['agent-dm']
    ],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const member = interaction.options.getUser('member', true)
            const message = interaction.options.getString('message', true)

            const guild = <Guild>interaction.guild
            const createdThread = await threads.get('dm', null, member.id)

            const agentDmChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['agent-dm'])

            const getThreadChannel = async (channel: TextChannel, threadId: string) => {
                const thread = await new Promise<ThreadChannel | null>((resolve, reject) => {
                    channel.threads.fetch(threadId).then(thread => {
                        resolve(thread)
                    }).catch(() => {
                        resolve(null)
                    })
                })
                return thread
            }

            let thread: ThreadChannel | null
            if(!createdThread) {
                thread = await agentDmChannel.threads.create({
                    name: member.username,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                    reason: `DM de ${member.tag}`
                })

                if(!thread.id) {
                    Logger.log('DMCommand', 'ERROR', `Échec de la création du thread ${member.username}`)
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'thread_creation_error'))
                } else {
                    Logger.log('DMCommand', 'INFO', `Thread "${member.username}" créé`)

                    const adminsList = (<Role>guild.roles.cache.get(config.guild.roles["Admin"])).members
                    const modosList = (<Role>guild.roles.cache.get(config.guild.roles["Modérateur"])).members

                    const members = adminsList.concat(modosList)

                    for(const [, member] of members) {
                        Logger.log('DMCommand', 'INFO', `Ajout de ${member.user.tag} au nouveau thread`)
                        await thread.members.add(member.user.id)
                    }

                    await threads.add('dm', thread.id, member.id)
                }
            } else {
                thread = await getThreadChannel(agentDmChannel, createdThread.threadId)
                if(!thread) {
                    Logger.log('DMCommand', 'ERROR', `Thread "${member.username}" introuvable`)
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'thread_not_found_error'))
                }
            }

            if(thread) {
                if(thread.archived) await thread.setArchived(false)
                if(thread.locked) await thread.setLocked(false)

                await thread.send({ content: `${userMention(interaction.user.id)}: ${message}` })

                try {
                    await member.send({ content: `${userMention(interaction.user.id)}: ${message}` })
                    Logger.log('DMCommand', 'INFO', `Message privé envoyé à ${member.tag}`)
                    await interaction.reply({ content: Locales.get(interaction.locale, 'dm_sent', userMention(member.id)), ephemeral: true })
                } catch(error) {
                    Logger.log('DMCommand', 'ERROR', `Le message privé à ${member.tag} n'a pas pu être envoyé`)
                    await interaction.reply({ content: Locales.get(interaction.locale, 'dm_not_sent', userMention(member.id)), ephemeral: true })
                }
            } else {
                throw new CommandInteractionError(Locales.get(interaction.locale, 'dm_error'))
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}