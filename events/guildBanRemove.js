import { GuildBan, TextChannel, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Emitted whenever a member is unbanned from a guild
     * @param {GuildBan} ban The ban that was removed
     */
    async execute(ban) {
        const guild = ban.client.guilds.cache.get(config.guild.id)
        /** @type {TextChannel} */
        const logsChannel = guild.channels.cache.get(config.guild.channels['logs'])

        const embed = new Embed()
            .setColor('#2ECC71')
            .setTitle(`🔨 Fin de ban pour ${ban.user.tag}`)
            .setThumbnail(ban.user.displayAvatarURL({ forceStatic: false }))
            .addFields({ name: 'Membre', value: userMention(ban.user.id) })

        await logsChannel.send({ embeds: [embed] })
    }
}