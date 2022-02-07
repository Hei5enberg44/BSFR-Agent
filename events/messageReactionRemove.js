const { MessageReaction, User } = require('discord.js')
const { Reactions } = require('../controllers/database')
const { Op } = require('sequelize')
const rules = require('../controllers/rules')

module.exports = {
	/**
	 * Emitted whenever a reaction is removed from a cached message
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user whose emoji or reaction emoji was removed
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
				// Retrait de rôle après refus des règles
				case 'rules':
					await rules.refuse(reaction, user)
					break
			}
		}
	}
}