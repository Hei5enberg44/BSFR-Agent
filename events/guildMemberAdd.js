const { MessageEmbed, GuildMember } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const mute = require('../controllers/mute')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a user joins a guild
	 * @param {GuildMember} member The member that has joined a guild
	 */
	async execute(member) {
		await module.exports.welcome(member)
		await mute.remute(member)
	},

    /**
     * On log l'arrivée du membre dans le channel logs
     * @param {GuildMember} member The member that has joined a guild
     */
    async welcome(member) {
        const logsChannel = member.guild.channels.cache.get(config.guild.channels.logs.id)

        const embed = new MessageEmbed()
            .setColor('#2ECC71')
            .setTitle('📥 Arrivée de ' + member.user.username)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addField('Koukou twa', userMention(member.user.id))
            .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)

        await logsChannel.send({ embeds: [embed] })

        Logger.log('Join', 'INFO', `Le membre ${member.user.tag} a rejoint le serveur`)
    }
}