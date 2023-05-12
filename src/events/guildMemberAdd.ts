import { GuildMember, TextChannel, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import mute from '../controllers/mute.js'
import { ReactionModel } from '../controllers/database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default class guildMemberAdd {
    private static member: GuildMember

    /**
     * Emitted whenever a user joins a guild
     * @param member The member that has joined a guild
     */
    static async execute(member: GuildMember) {
        this.member = member

        await this.welcome()
        await this.removeRulesReactions()
        await mute.remute(member)
    }

    /**
     * On log l'arrivée du membre dans le salon #logs
     */
    private static async welcome() {
        const member = this.member
        
        const logsChannel = <TextChannel>member.guild.channels.cache.get(config.guild.channels['logs'])

        const embed = new Embed()
            .setColor('#2ECC71')
            .setTitle(`📥 Arrivée de ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
            .addFields(
                { name: 'Membre', value: userMention(member.user.id) },
                { name: 'Compte créé le', value: `${(new Date(member.user.createdTimestamp)).toLocaleString()}` }
            )

        await logsChannel.send({ embeds: [embed] })

        Logger.log('Join', 'INFO', `Le membre ${member.user.tag} a rejoint le serveur`)
    }

    /**
     * Supprime les réactions d'un membre sur le message des règles du serveur Discord
     */
    private static async removeRulesReactions() {
        const member = this.member

        const rulesReaction = await ReactionModel.findOne({ where: { type: 'rules' } })

        if(rulesReaction) {
            const rulesChannel = <TextChannel>member.guild.channels.cache.get(<string>rulesReaction.interaction.channelId)
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