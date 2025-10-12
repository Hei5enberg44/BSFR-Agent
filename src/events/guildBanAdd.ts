import {
    EmbedBuilder,
    Guild,
    GuildBan,
    TextChannel,
    userMention
} from 'discord.js'
import config from '../../config.json' with { type: 'json' }

export default class guildBanAdd {
    private static ban: GuildBan

    /**
     * Emitted whenever a member is banned from a guild
     * @param ban Represents a ban in a guild on Discord
     */
    static async execute(ban: GuildBan) {
        this.ban = ban

        this.add()
    }

    /**
     * Envoi un message dans le salon #logs pour prévenir du bannissement d'un membre
     */
    private static async add() {
        const ban = this.ban

        await new Promise((res) => setTimeout(res, 1000))
        await ban.fetch(true)

        const guild = ban.client.guilds.cache.get(config.guild.id) as Guild
        const logsChannel = guild.channels.cache.get(
            config.guild.channels['logs']
        ) as TextChannel

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`🔨 Ban de ${ban.user.username}`)
            .setThumbnail(ban.user.displayAvatarURL({ forceStatic: false }))
            .addFields([
                {
                    name: 'Membre',
                    value: userMention(ban.user.id),
                    inline: true
                },
                { name: 'Raison', value: ban.reason ?? '' }
            ])

        await logsChannel.send({ embeds: [embed] })
    }
}
