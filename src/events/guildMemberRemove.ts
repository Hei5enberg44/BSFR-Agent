import {
    GuildMember,
    Role,
    TextChannel,
    userMention,
    roleMention,
    EmbedBuilder
} from 'discord.js'
import { BirthdayModel } from '../models/birthday.model.js'
import { CityModel } from '../models/city.model.js'
import { TwitchModel } from '../models/twitch.model.js'
import { OldMemberRoleModel } from '../models/oldMemberRole.model.js'
import threads from '../controllers/threads.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default class guildMemberRemove {
    private static member: GuildMember

    /**
     * Emitted whenever a member leaves a guild, or is kicked
     * @param member The member that has left/been kicked from the guild
     */
    static async execute(member: GuildMember) {
        this.member = member

        await this.saveOldMemberRoles()
        await this.bye()
        await this.removeBirthday()
        await this.removeCity()
        await this.removeTwitch()
        await this.updateThreads()
    }

    /**
     * On enregistre les rôles du membre dans la base de données
     * juste avant que celui-ci quitte le serveur
     */
    private static async saveOldMemberRoles() {
        const member = this.member

        const roles = member.roles.cache
            .map((role: Role, id: string) => {
                return { id, name: role.name }
            })
            .filter((role) => role.name !== '@everyone')

        const oldMemberRoles = await OldMemberRoleModel.findOne({
            where: { memberId: member.id }
        })
        if (oldMemberRoles) {
            oldMemberRoles.roles = roles
            await oldMemberRoles.save()
        } else {
            await OldMemberRoleModel.create({
                memberId: member.id,
                roles
            })
        }
    }

    /**
     * On log le départ du membre dans le salon #logs
     */
    private static async bye() {
        const member = this.member

        const logsChannel = member.guild.channels.cache.get(
            config.guild.channels['logs']
        ) as TextChannel

        // On récupère les rôles du membre depuis la base de données que celui-ci avait avant de quitter le serveur
        const oldMemberRoles = await OldMemberRoleModel.findOne({
            where: { memberId: member.id }
        })

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`📤 Départ de ${member.user.username}`)
            .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
            .addFields({ name: 'Membre', value: userMention(member.user.id) })

        if (oldMemberRoles && oldMemberRoles.roles.length > 0)
            embed.addFields({
                name: 'Anciens rôles',
                value: oldMemberRoles.roles
                    .map((role) => roleMention(role.id))
                    .join(', ')
            })

        await logsChannel.send({ embeds: [embed] })

        Logger.log(
            'Leave',
            'INFO',
            `Le membre ${member.user.username} a quitté le serveur`
        )
    }

    /**
     * Si un membre part, on le supprime de la table birthdays
     */
    private static async removeBirthday() {
        const member = this.member

        const del = await BirthdayModel.destroy({
            where: {
                memberId: member.user.id
            }
        })

        if (del > 0)
            Logger.log(
                'Birthday',
                'INFO',
                `Le membre ${member.user.username} a quitté le serveur, sa date d'anniversaire a été supprimée de la base de données`
            )
    }

    /**
     * Si un membre part, on le supprime de la table cities
     */
    private static async removeCity() {
        const member = this.member

        const del = await CityModel.destroy({
            where: {
                memberId: member.user.id
            }
        })

        if (del > 0)
            Logger.log(
                'City',
                'INFO',
                `Le membre ${member.user.username} a quitté le serveur, sa ville d'origine a été supprimée de la base de données`
            )
    }

    /**
     * Si un membre part, on le supprime de la table twitch
     * @param member The member that has left/been kicked from the guild
     */
    private static async removeTwitch() {
        const member = this.member

        const del = await TwitchModel.destroy({
            where: {
                memberId: member.user.id
            }
        })

        if (del > 0)
            Logger.log(
                'Twitch',
                'INFO',
                `Le membre ${member.user.username} a quitté le serveur, sa chaîne Twitch a été supprimée de la base de données`
            )
    }

    /**
     * Supprime un membre des threads de messages privés si celui-ci quitte le serveur
     */
    private static async updateThreads() {
        const member = this.member

        const isInStaff = member.roles.cache.find((r) =>
            [
                config.guild.roles['Admin'],
                config.guild.roles['Modérateur']
            ].includes(r.id)
        )

        // Si le membre faisait partie du staff
        if (isInStaff) {
            await threads.removeMember('dm', member)
        }
    }
}
