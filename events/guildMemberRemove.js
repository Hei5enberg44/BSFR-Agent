const { MessageEmbed, GuildMember } = require('discord.js')
const { userMention } = require('@discordjs/builders')
const { Birthdays } = require('../controllers/database')
const threads = require('../controllers/threads')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a member leaves a guild, or is kicked
	 * @param {GuildMember} member The member that has left/been kicked from the guild
	 */
	async execute(member) {
		await module.exports.bye(member)
        await module.exports.removeBirthday(member)
        await module.exports.updateThreads(member)
	},

    /**
     * On log le départ du membre dans le channel logs
     * @param {GuildMember} member The member that has left/been kicked from the guild
     */
    async bye(member) {
        const logsChannel = member.guild.channels.cache.get(config.guild.channels.logs.id)

        const embed = new MessageEmbed()
            .setColor('#E74C3C')
            .setTitle('📤 Départ de ' + member.user.username)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addField('Orevouar', userMention(member.user.id))
            .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)
        
        await logsChannel.send({ embeds: [embed] })

        Logger.log('Leave', 'INFO', `Le membre ${member.user.tag} a quitté le serveur`)
    },

    /**
     * Si un membre part, on le supprime de la table birthdays
     * @param {GuildMember} member The member that has left/been kicked from the guild
     */
    async removeBirthday(member) {
        const del = await Birthdays.destroy({
            where: {
                memberId: member.user.id
            }
        })

        if(del > 0) Logger.log('Birthday', 'INFO', `Le membre ${member.user.tag} a quitté le serveur, sa date d'anniversaire a été supprimée de la base de données`)
    },

    /**
	 * Supprime un membre des threads de messages privés si celui-ci quitte le serveur
	 * @param {GuildMember} member The member that has left/been kicked from the guild
	 */
     async updateThreads(member) {
        const isInStaff = member.roles.cache.find(r => [ config.guild.roles['Admin'], config.guild.roles['Modérateur'] ].includes(r.id))

        // Si le membre faisait partie du staff
        if(isInStaff) {
            await threads.removeMember('dm', member)
        }
    }
}