import { CommandInteraction, ApplicationCommandOptionType, userMention } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import threads from '../controllers/threads.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: {
        name: 'dm',
        description: 'Envoie un message privé à un membre',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'membre',
                description: 'Membre à qui envoyer un message privé',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'message',
                description: 'Message',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],
    channels: [ 'agentDm' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const member = interaction.options.getUser('membre')
            const message = interaction.options.getString('message')
            const createdThread = await threads.get('dm', null, member.id)
            const agentDmChannel = interaction.guild.channels.cache.get(config.guild.channels.agentDm)

            let thread
            if(!createdThread) {
                thread = await agentDmChannel.threads.create({
                    name: member.username,
                    autoArchiveDuration: 1440,
                    reason: 'DM de ' + member.tag
                })

                if(!thread.id) {
                    Logger.log('DMCommand', 'ERROR', `Échec de la création du thread ${member.username}`)
                    throw new CommandInteractionError('Échec de la création du thread. Le message n\'a pas été envoyé.')
                } else {
                    Logger.log('DMCommand', 'INFO', `Thread "${member.username}" créé`)

                    const adminsList = interaction.guild.roles.cache.get(config.guild.roles["Admin"]).members
                    const modosList = interaction.guild.roles.cache.get(config.guild.roles["Modérateur"]).members

                    const members = adminsList.concat(modosList)

                    for(const [, member] of members) {
                        Logger.log('DMCommand', 'INFO', `Ajout de ${member.user.tag} au nouveau thread`)
                        await thread.members.add(member.user.id)
                    }

                    await threads.add('dm', thread.id, member.id)
                }
            } else {
                thread = await agentDmChannel.threads.fetch(createdThread.threadId)

                if(thread) {
                    Logger.log('DMCommand', 'INFO', `Thread "${member.username}" trouvé`)
                } else {
                    Logger.log('DMCommand', 'ERROR', `Thread "${member.username}" introuvable`)
                    throw new CommandInteractionError('Thread introuvable. Le message n\'a pas été envoyé.')
                }
            }

            if(thread) {
                if(thread.archived) await thread.setArchived(false)
                if(thread.locked) await thread.setLocked(false)

                await thread.send({ content: `${userMention(interaction.user.id)}: ${message}` })

                try {
                    await member.send({ content: `${userMention(interaction.user.id)}: ${message}` })
                    Logger.log('DMCommand', 'INFO', `Message privé envoyé à ${member.tag}`)
                    await interaction.reply({ content: `Le message privé à ${userMention(member.id)} a bien été envoyé`, ephemeral: true })
                } catch(error) {
                    Logger.log('RCommand', 'ERROR', `Le message privé à ${member.tag} n'a pas pu être envoyé`)
                    await interaction.reply({ content: `Le message privé à ${userMention(member.id)} n'a pas pu être envoyé` })
                }
            } else {
                throw new CommandInteractionError('Une erreur est survenue lors de l\'envoi du message privé.')
            }
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}