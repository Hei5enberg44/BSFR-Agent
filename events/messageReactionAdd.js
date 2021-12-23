const { MessageReaction, User } = require('discord.js')
const { Reactions } = require('../controllers/database')
const { Op } = require('sequelize')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const ban = require('../controllers/ban')
const twitter = require('../controllers/twitter')

module.exports = {
	/**
	 * Emitted whenever a reaction is added to a cached message
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user that applied the guild or reaction emoji
	 */
	async execute(reaction, user) {
		if(reaction.partial)
			await reaction.fetch()

		const r = await Reactions.findOne({
			where: {
				[Op.and]: [
					{ channelId: reaction.message.channelId },
					{ messageId: reaction.message.id }
				]
			}
		})

		if(r && !user.bot) {
			const type = r.type

			switch(type) {
				// Supression de mots bannis
				case 'removeBannedWord':
					await bannedWords.confirmRemove(reaction, user, r)
					break
				// Supression de messages d'anniversaire
				case 'removeBirthdayMessage':
					await birthdayMessages.confirmRemove(reaction, user, r)
					break
				// Confirmation de bannissement d'un membre
				case 'banRequest':
					await ban.ban(reaction, user, r)
					break
				// Confirmation d'envoi de tweet
				case 'tweetRequest':
					if(user.id === r.memberId) {
						await twitter.confirm(reaction, user, r)
					}
					break
			}
		}
	}
}