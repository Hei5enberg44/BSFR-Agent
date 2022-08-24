const { GuildMember, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const mute = require('../controllers/mute')
const { Reactions } = require('../controllers/database')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	/**
	 * Emitted whenever a user joins a guild
	 * @param {GuildMember} member The member that has joined a guild
	 */
	async execute(member) {
		await module.exports.welcome(member)
        await module.exports.removeRulesReactions(member)
        await mute.remute(member)
	},

    /**
     * On log l'arrivée du membre dans le channel logs
     * @param {GuildMember} member The member that has joined a guild
     */
    async welcome(member) {
        const logsChannel = member.guild.channels.cache.get(config.guild.channels.logs)

        const embed = new Embed()
            .setColor('#2ECC71')
            .setTitle('📥 Arrivée de ' + member.user.username)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Membre', value: userMention(member.user.id) },
                { name: 'Compte créé le', value: `${(new Date(member.user.createdTimestamp)).toLocaleString()}` }
            )

        await logsChannel.send({ embeds: [embed] })

        Logger.log('Join', 'INFO', `Le membre ${member.user.tag} a rejoint le serveur`)
    },

    /**
	 * Supprime les réactions d'un membre sur le message des règles du serveur Discord
	 * @param {GuildMember} member The member that has left/been kicked from the guild
	 */
    async removeRulesReactions(member) {
        const rulesReaction = await Reactions.findOne({ where: { type: 'rules' } })

        if(rulesReaction) {
            const rulesChannel = member.guild.channels.cache.get(rulesReaction.channelId)
            if(rulesChannel) {
                const rulesMessage = await rulesChannel.messages.fetch(rulesReaction.messageId)
                if(rulesMessage) {
                    const rulesMessageReactions = rulesMessage.reactions.cache
                    for(const [, rulesMessageReaction] of rulesMessageReactions) {
                        await rulesMessageReaction.users.remove(member.user)
                    }
                    Logger.log('Rules', 'INFO', `Les réactions sur le message des règles pour le membre ${member.user.tag} ont été supprimées`)
                }
            }
        }
    }
}