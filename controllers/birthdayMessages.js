const { GuildMember, MessageReaction, User } = require("discord.js")
const Embed = require('../utils/embed')
const { BirthdayMessagesError } = require('../utils/error')
const { BirthdayMessages, Reactions } = require('./database')
const Logger = require('../utils/logger')

module.exports = {
    /**
     * Ajoute un message d'anniversaire dans la base de données
     * @param {String} message message d'anniversaire
     * @param {GuildMember} member membre réalisant la demande d'ajout
     * @returns {Promise<{new: String, old: String}>} liste des messages d'anniversaire
     */
    add: async function(message, member) {
        message = message.trim()

        const result = {
            new: '',
            old: ''
        }

        const exists = await BirthdayMessages.count({ where: { message: message } })

        if(exists === 0) {
            await BirthdayMessages.create({
                message: message,
                memberId: member.id
            })

            result.new = message
        } else {
            result.old = message
        }

        return result
    },

    /**
     * Récupère une liste de messages d'anniversaire par rapport à un ou plusieurs ids
     * @param {String} ids identifiant(s) des messages d'anniversaire à récupérer
     * @returns {Promise<Array.<{id: Number, message: String, memberId: String, date: Date}>>} liste des messages d'anniversaire
     */
    get: async function(ids) {
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
     * @param {Number} page page à retourner
     * @returns {Promise<String>} liste des messages d'anniversaire
     */
    list: async function(page) {
        const itemsPerPage = 10

        const messagesCount = await BirthdayMessages.count()

        if(messagesCount == 0)
            throw new BirthdayMessagesError('Il n\'y a aucun message d\'anniversaire pour le moment.')
        
        const pageCount = Math.ceil(messagesCount / itemsPerPage)

        if(page > pageCount)
            throw new BirthdayMessagesError('La page demandée n\'existe pas.')

        const messages = await BirthdayMessages.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let messagesList = ''
        for(const message of messages) {
            messagesList += `${message.id} - ${message.message}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return messagesList + '\n' + pageInfo
    },

    /**
     * Ajout d'une requête de suppression de messages d'anniversaire dans la base de données
     * @param {Object} messagesList liste des messages d'anniversaire à supprimer
     * @param {String} memberId identifiant du membre ayant effectué la demande de suppression
     * @param {String} channelId identifiant du salon dans lequel la demande de suppression a été effectuée
     * @param {String} messageId identifiant du message de confirmation de suppression
     */
    remove: async function(messagesList, memberId, channelId, messageId) {
        await Reactions.create({
            type: 'removeBirthdayMessage',
            data: messagesList,
            memberId: memberId,
            channelId: channelId,
            messageId: messageId
        })
    },

    /**
	 * Supression de messages d'anniversaire
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user that applied the guild or reaction emoji
	 * @param {{id: Number, type: String, data: Array.<{id: Number, message: String, memberId: String, date: Date}>, memberId: String, channelId: String, messageId: String, date: Date}} r données concernant la réaction
	 */
    confirmRemove: async function(reaction, user, r) {
        const embed = new Embed()
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.addFields({ name: 'Membre', value: user.tag })

		if(reaction.emoji.name === '✅') {
			const ids = r.data.map(message => message.id)
			await BirthdayMessages.destroy({ where: { id: ids } })
			await Reactions.destroy({ where: { id: r.id } })

			Logger.log('BirthdayMessages', 'INFO', `${user.tag} a supprimé les messages d'anniversaire suivants : ${r.data.map(message => message.message).join(', ')}`)

			embed.setColor('#2ECC71')
				.setTitle('🗑️ Suppression de messages d\'anniversaire')
				.addFields({ name: 'Messages d\'anniversaire supprimés', value: r.data.map(message => message.message).join('\n') })

			await reaction.message.reactions.removeAll()
			await reaction.message.edit({ embeds: [embed] })
		} else if(reaction.emoji.name === '❌') {
			await Reactions.destroy({ where: { id: r.id } })

			embed.setColor('#E74C3C')
				.setTitle('🗑️ Refus de suppression de messages d\'anniversaire')
				.addFields({ name: 'Messages d\'anniversaire non supprimés', value: r.data.map(message => message.message).join('\n') })

			await reaction.message.reactions.removeAll()
			await reaction.message.edit({ embeds: [embed] })
		}
    }
}