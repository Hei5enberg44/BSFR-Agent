const { MessageReaction, User } = require("discord.js")
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
	 * Attribution de rôle après acceptation des règles
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user that applied the guild or reaction emoji
	 */
    accept: async function(reaction, user) {
        const guild = reaction.client.guilds.cache.get(config.guild.id)
		const member = guild.members.cache.get(user.id)

        if(reaction.emoji.name === '✅') {
			const role = guild.roles.cache.find(r => r.id === config.guild.roles["Membre"])
			if(role) {
				Logger.log('Rules', 'INFO', `${user.tag} a accepté les règles. Le rôle @Membre lui a été attribué.`)
				await member.roles.add(role)
			}
		} else if(reaction.emoji.name === '☑️') {
			const role = guild.roles.cache.find(r => r.id === config.guild.roles["Not French Boi"])
			if(role) {
				Logger.log('Rules', 'INFO', `${user.tag} a accepté les règles. Le rôle @Not French Boi lui a été attribué.`)
				await member.roles.add(role)
			}
		}
    },

	/**
	 * Suppression de rôle après refus des règles
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user that applied the guild or reaction emoji
	 */
	refuse: async function(reaction, user) {
        const guild = reaction.client.guilds.cache.get(config.guild.id)
		const member = guild.members.cache.get(user.id)

        if(reaction.emoji.name === '✅') {
			const role = guild.roles.cache.find(r => r.id === config.guild.roles["Membre"])
			if(role) {
				Logger.log('Rules', 'INFO', `${user.tag} a refusé les règles. Le rôle @Membre lui a été retiré.`)
				await member.roles.remove(role)
			}
		} else if(reaction.emoji.name === '☑️') {
			const role = guild.roles.cache.find(r => r.id === config.guild.roles["Not French Boi"])
			if(role) {
				Logger.log('Rules', 'INFO', `${user.tag} a refusé les règles. Le rôle @Not French Boi lui a été retiré.`)
				await member.roles.remove(role)
			}
		}
    }
}