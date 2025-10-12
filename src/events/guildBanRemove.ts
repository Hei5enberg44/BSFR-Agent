import {
    EmbedBuilder,
    Guild,
    GuildBan,
    TextChannel,
    userMention
} from 'discord.js'
import config from '../../config.json' with { type: 'json' }

export default class guildBanRemove {
    private static ban: GuildBan

    /**
     * Emitted whenever a member is unbanned from a guild
     * @param ban Represents a ban in a guild on Discord
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

        const guild = ban.client.guilds.cache.get(config.guild.id) as Guild
        const logsChannel = guild.channels.cache.get(
            config.guild.channels['logs']
        ) as TextChannel

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle(`🔨 Fin de ban pour ${ban.user.username}`)
            .setThumbnail(ban.user.displayAvatarURL({ forceStatic: false }))
            .addFields({ name: 'Membre', value: userMention(ban.user.id) })

        await logsChannel.send({ embeds: [embed] })
    }
}
