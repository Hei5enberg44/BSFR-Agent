import { Guild, Message, TextChannel, userMention, codeBlock } from 'discord.js'
import Embed from '../utils/embed.js'
import config from '../config.json' with { type: 'json' }

export default class AntiSpam {
    private static messageList: Message[] = []

    /**
     * Vérifie si un membre spam un message dans différents salons en l'espace de quelques secondes
     * Si oui, on supprime les messages et on timeout le membre
     * @param message The created message
     */
    static async check(message: Message) {
        const date = Date.now()
        this.messageList = this.messageList.filter(m => m.createdTimestamp >= date - 60 * 5 * 1000)
        this.messageList.push(message)
        const memberMessages = this.messageList.filter(m => m.author.id === message.author.id && m.createdTimestamp >= date - 3000)
        if(memberMessages.length >= 10) {
            const member = message.member
            if(member) {
                const guild = <Guild>message.guild
                const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])

                await member.timeout(60 * 60 * 24 * 1000, 'spam')

                const embed = new Embed()
                    .setColor('#E74C3C')
                    .setTitle('🚨 Hack de compte détécté !')
                    .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                    .setDescription(`${userMention(member.id)} a été timeout pour une durée d'une heure.\n\nContenu du message :\n${codeBlock(memberMessages[memberMessages.length - 1].content)}`)

                try {
                    await logsChannel.send({ embeds: [embed] })
                } catch(err) {}

                const messagesToDelete = this.messageList.filter(m => m.author.id === message.author.id)
                for(const m of messagesToDelete) {
                    try {
                        await m.delete()
                    } catch(err) {}
                }
            }
        }
    }
}