const { GuildBan, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a member is unbanned from a guild
	 * @param {GuildBan} ban The ban that was removed
	 */
	async execute(ban) {
        const guild = ban.client.guilds.cache.get(config.guild.id)
		const logsChannel = guild.channels.cache.get(config.guild.channels.logs)

        const embed = new Embed()
            .setColor('#2ECC71')
            .setTitle('🔨 Déban de ' + ban.user.username)
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .addFields({ name: 'Utilisateur', value: userMention(ban.user.id) })

        await logsChannel.send({ embeds: [embed] })
	}
}