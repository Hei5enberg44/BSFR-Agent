import { Guild, GuildBan, TextChannel, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import config from '../config.json' with { type: 'json' }

export default class guildBanRemove {
    private static ban: GuildBan

    /**
     * Emitted whenever a member is unbanned from a guild
     * @param ban The ban that was removed
     */
    static async execute(ban: GuildBan) {
        this.ban = ban

        this.remove()
    }

    /**
     * Envoi un message dans le salon #logs pour prévenir de la fin de ban d'un membre
     */
    private static async remove() {
        const ban = this.ban

        const guild = <Guild>ban.client.guilds.cache.get(config.guild.id)
        const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])

        const embed = new Embed()
            .setColor('#2ECC71')
            .setTitle(`🔨 Fin de ban pour ${ban.user.username}`)
            .setThumbnail(ban.user.displayAvatarURL({ forceStatic: false }))
            .addFields({ name: 'Membre', value: userMention(ban.user.id) })

        await logsChannel.send({ embeds: [embed] })
    }
}