const { Presence } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a guild member's presence (e.g. status, activity) is changed
	 * @param {?Presence} oldPresence The presence before the update, if one at all
	 * @param {Presence} newPresence The presence after the update
	 */
	async execute(oldPresence, newPresence) {
		await module.exports.twitch(oldPresence, newPresence)
	},

    /**
     * Envoi d'un message dans #twitch si un membre lance un live
     * @param {?Presence} oldPresence The presence before the update, if one at all
	 * @param {Presence} newPresence The presence after the update
     */
    async twitch(oldPresence, newPresence) {
		const activity = newPresence.activities.find(a => a.name.toUpperCase() === 'TWITCH')

		if(activity) {
			const streamRole = newPresence.member.roles.cache.find(role => role.id === config.guild.roles["Streamer"])

			if(streamRole && activity.state.toUpperCase() === 'BEAT SABER') {
				// 150000 = 2min30
				if((new Date().getTime()) < activity.createdAt.getTime() + 150000) {
					Logger.log('Stream', 'INFO', `${newPresence.user.tag} stream ${activity.name} : ${activity.url}`)

					const twitchChannel = newPresence.guild.channels.cache.get(config.guild.channels.twitch.id)

					await twitchChannel.send({ content: `${userMention(newPresence.member.id)} - ${activity.details} - ${activity.url}`, allowedMentions: { repliedUser: false } })
				}
			}
		}
    }
}