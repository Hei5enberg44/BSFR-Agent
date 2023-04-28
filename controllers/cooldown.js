import { Message, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { Cooldowns } from './database.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un utilisateur en cooldown
     * @param {string} memberId identifiant du membre Discord
     */
    async add(memberId) {
        await Cooldowns.create({ memberId })
    },

    /**
     * @typedef {object} MemberCooldown
     * @property {number} id
     * @property {string} memberId
     * @property {Date} messageDate
     * @property {number} count
     */

    /**
     * Récupère un utilisateur en cooldown
     * @param {string} memberId identifiant du membre Discord
     * @returns {Promise<MemberCooldown>} informations du cooldown
     */
    async get(memberId) {
        const memberCooldown = await Cooldowns.findOne({
            where: { memberId }
        })
        return memberCooldown
    },

    /**
     * Supprime le cooldown d'un utilisateur
     * @param {string} memberId identifiant du membre Discord
     */
    async remove(memberId) {
        await Cooldowns.destroy({
            where: { memberId }
        })
    },

    /**
     * Vérifie si l'utilisateur est en cooldown,
     * et si celui-ci spam, il est mute
     * @param {Message} message The created message
     */
    async check(message) {
        let cooldown = false

        const member = message.member
        const memberId = member.id
        const memberCooldown = await this.get(memberId)

        const timeThreshold = 10 // seconds
        const countThreshold = 3
        const muteDuration = 10 // seconds

        if(memberCooldown) {
            const date = new Date()

            const messageDate = memberCooldown.messageDate

            if(!messageDate) {
                memberCooldown.messageDate = date
                memberCooldown.count = 1
                await memberCooldown.save()
            } else {
                const elapsedSeconds = Math.floor((date.getTime() - messageDate.getTime()) / 1000)

                if(elapsedSeconds > timeThreshold) {
                    memberCooldown.messageDate = date
                    memberCooldown.count = 1
                } else {
                    memberCooldown.count++

                    if(memberCooldown.count >= countThreshold) {
                        memberCooldown.messageDate = null
                        memberCooldown.count = 0
                        cooldown = true
                    }
                }

                await memberCooldown.save()
            }
        }

        if(cooldown) {
            const guild = message.guild
            const muteRole = guild.roles.cache.find(r => r.id === config.guild.roles['Muted'])

            const logsChannel = guild.channels.cache.get(config.guild.channels.logs)

            try {
                await member.roles.add(muteRole)
                await member.send({ content: `Mollo l'asticot ! Évites de spammer s'il te plaît.\nPour la peine, tu es mute pendant ${muteDuration} seconde${muteDuration > 1 ? 's' : ''}.` })

                const embed = new Embed()
                        .setColor('#2ECC71')
                        .setTitle('⏳ Spam détécté !')
                        .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                        .setDescription(`${userMention(member.id)} s'est pris un cooldown`)

                await logsChannel.send({ embeds: [embed] })

                setTimeout(async () => {
                    await member.roles.remove(muteRole)
                }, muteDuration * 1000)
            } catch(e) {}
        }
    }
}