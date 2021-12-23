const { GuildMember } = require('discord.js')
const threads = require('../controllers/threads')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a guild member changes - i.e. new role, removed role, nickname
	 * @param {GuildMember} oldMember The member before the update
	 * @param {GuildMember} newMember The member after the update
	 */
	async execute(oldMember, newMember) {
        await module.exports.updateThreads(oldMember, newMember)
	},

    /**
	 * Ajoute ou supprime un membre des threads de messages privés si celui-ci rejoint ou quitte le staff
	 * @param {GuildMember} oldMember The member before the update
	 * @param {GuildMember} newMember The member after the update
	 */
    async updateThreads(oldMember, newMember) {
        const wasInStaff = oldMember.roles.cache.find(r => [ config.guild.roles['Admin'], config.guild.roles['Modérateur'] ].includes(r.id))
        const isInStaff = newMember.roles.cache.find(r => [ config.guild.roles['Admin'], config.guild.roles['Modérateur'] ].includes(r.id))

        if(!wasInStaff && isInStaff) {
            // Si le membre a rejoint le staff
            await threads.addMember('dm', newMember)
        } else if(wasInStaff && !isInStaff) {
            // Si le membre a quiité le staff
            await threads.removeMember('dm', newMember)
        }
    }
}