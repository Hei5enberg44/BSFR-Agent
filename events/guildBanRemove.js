const { MessageEmbed, GuildBan } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a member is unbanned from a guild
	 * @param {GuildBan} ban The ban that was removed
	 */
	async execute(ban) {
        const guild = ban.client.guilds.cache.get(config.guild.id)
		const logsChannel = guild.channels.cache.get(config.guild.channels.logs.id)

        const embed = new MessageEmbed()
            .setColor('#2ECC71')
            .setTitle("🔨 Déban de " + ban.user.username)
            .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
            .addField("Utilisateur", userMention(ban.user.id))
            .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })

        await logsChannel.send({ embeds: [embed] })
	}
}