import {
    GuildMember,
    TextChannel,
    userMention,
    roleMention,
    EmbedBuilder
} from 'discord.js'
import { OldMemberRoleModel } from '../models/oldMemberRole.model.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default class guildMemberAdd {
    private static member: GuildMember

    /**
     * Emitted whenever a user joins a guild
     * @param member The member that has joined a guild
     */
    static async execute(member: GuildMember) {
        this.member = member

        await this.welcome()
    }

    /**
     * On log l'arrivée du membre dans le salon #logs
     */
    private static async welcome() {
        const member = this.member

        const logsChannel = member.guild.channels.cache.get(
            config.guild.channels['logs']
        ) as TextChannel

        // On récupère les rôles du membre depuis la base de données que celui-ci avait avant de quitter le serveur
        const oldMemberRoles = await OldMemberRoleModel.findOne({
            where: { memberId: member.id }
        })

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle(`📥 Arrivée de ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
            .addFields(
                { name: 'Membre', value: userMention(member.user.id) },
                {
                    name: 'Compte créé le',
                    value: `${new Date(member.user.createdTimestamp).toLocaleString()}`
                }
            )

        if (oldMemberRoles && oldMemberRoles.roles.length > 0)
            embed.addFields({
                name: 'Anciens rôles',
                value: oldMemberRoles.roles
                    .map((role) => roleMention(role.id))
                    .join(', ')
            })

        await logsChannel.send({ embeds: [embed] })

        Logger.log(
            'Join',
            'INFO',
            `Le membre ${member.user.username} a rejoint le serveur`
        )
    }
}
