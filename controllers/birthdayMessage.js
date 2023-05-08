import { GuildMember, MessageReaction, CommandInteraction, User, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { BirthdayMessages, Reactions } from './database.js'
import { PageNotFoundError, BirthdayMessageEmptyError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    /**
     * Ajoute un message d'anniversaire dans la base de données
     * @param {string} message message d'anniversaire
     * @param {GuildMember} member membre réalisant la demande d'ajout
     */
    async add(message, member) {
        await BirthdayMessages.create({
            message: message.trim(),
            memberId: member.id
        })
    },

    /**
     * @typedef {Object} BirthdayMessage
     * @property {number} id
     * @property {string} message
     * @property {string} memberId
     * @property {Date} date
     */

    /**
     * Récupère une liste de messages d'anniversaire par rapport à un ou plusieurs ids
     * @param {string} ids identifiant(s) des messages d'anniversaire à récupérer
     * @returns {Promise<Array<BirthdayMessage>>} liste des messages d'anniversaire
     */
    async get(ids) {
        ids = ids.split(';').map(id => id.trim())

        const messagesList = await BirthdayMessages.findAll({
            where: {
                id: ids
            }
        })

        return messagesList
    },

    /**
     * Retourne la liste des messages d'anniversaire depuis la base de données
     * @param {number} page page à retourner
     * @returns {Promise<{items: Array<BirthdayMessage>, page: number, pageCount: number}>} liste des messages d'anniversaire
     */
    async list(page) {
        const itemsPerPage = 10

        const messagesCount = await BirthdayMessages.count()

        if(messagesCount == 0)
            throw new BirthdayMessageEmptyError()
        
        const pageCount = Math.ceil(messagesCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const messages = await BirthdayMessages.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        return {
            items: messages,
            page,
            pageCount
        }
    },

    /**
     * Ajout d'une requête de suppression de messages d'anniversaire dans la base de données
     * @param {Array<BirthdayMessage>} messagesList liste des messages d'anniversaire à supprimer
     * @param {CommandInteraction} interaction interaction Discord
     * @param {string} messageId identifiant du message de confirmation de suppression
     */
    async remove(messagesList, interaction, messageId) {
        await Reactions.create({
            type: 'removeBirthdayMessage',
            data: messagesList,
            interaction: {
                locale: interaction.locale,
                commandName: interaction.commandName,
                memberId: interaction.user.id,
                channelId: interaction.channel.id
            },
            messageId: messageId
        })
    },

    /**
     * @typedef {Object} Reaction
     * @property {number} id
     * @property {string} type
     * @property {Array<BirthdayMessage>} data
     * @property {{locale: string, commandName: string, memberId: string, channelId: string}} interaction
     * @property {string} messageId
     * @property {Date} date
     */

    /**
     * Supression de messages d'anniversaire
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {Reaction} r données concernant la réaction
     */
    async confirmRemove(reaction, user, r) {
        if(r.interaction.memberId === user.id) {
            const embed = new Embed()
                .setThumbnail(user.displayAvatarURL({ forceStatic: false }))
                .addFields({ name: Locales.get(r.interaction.locale, 'member'), value: userMention(user.id) })

            if(reaction.emoji.name === '✅') {
                const ids = r.data.map(message => message.id)
                await BirthdayMessages.destroy({ where: { id: ids } })
                await Reactions.destroy({ where: { id: r.id } })

                Logger.log('BirthdayMessage', 'INFO', `${user.tag} a supprimé les messages d'anniversaire suivants : ${r.data.map(message => message.message).join(', ')}`)

                embed.setColor('#2ECC71')
                    .setTitle(Locales.get(r.interaction.locale, 'delete_birthday_messages'))
                    .addFields({ name: Locales.get(r.interaction.locale, 'deleted_birthday_messages'), value: r.data.map(message => message.message).join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            } else if(reaction.emoji.name === '❌') {
                await Reactions.destroy({ where: { id: r.id } })

                embed.setColor('#E74C3C')
                    .setTitle(Locales.get(r.interaction.locale, 'delete_birthday_messages_refusal'))
                    .addFields({ name: Locales.get(r.interaction.locale, 'undeleted_birthday_messages'), value: r.data.map(message => message.message).join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            }
        } else {
            await reaction.users.remove(user)
        }
    }
}