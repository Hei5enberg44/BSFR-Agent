import { Message, TextChannel, userMention, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import { Cooldowns } from './database.js'
import { PageNotFoundError, CooldownEmptyError } from '../utils/error.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un membre en cooldown
     * @param {string} memberId identifiant du membre Discord
     * @param {number} timeThreshold laps de temps entre le premier et le dernier message envoyé (en secondes)
     * @param {number} countThreshold nombre de messages envoyés dans le laps de temps
     * @param {number} muteDuration durée du mute du membre (en secondes)
     */
    async add(memberId, timeThreshold, countThreshold, muteDuration) {
        await Cooldowns.create({
            memberId,
            timeThreshold,
            countThreshold,
            muteDuration
        })
    },

    /**
     * @typedef {Object} MemberCooldown
     * @property {number} id
     * @property {string} memberId
     * @property {number} timeThreshold
     * @property {number} countThreshold
     * @property {number} muteDuration
     * @property {Date} messageDate
     * @property {number} count
     */

    /**
     * Récupère un membre en cooldown
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
     * Supprime le cooldown d'un membre
     * @param {string} memberId identifiant du membre Discord
     */
    async remove(memberId) {
        await Cooldowns.destroy({
            where: { memberId }
        })
    },

    /**
     * Retourne la liste des cooldowns depuis la base de données
     * @param {number} page page à retourner
     * @returns {Promise<{items: Array<MemberCooldown>, page: number, pageCount: number}>} liste des cooldowns
     */
    async list(page) {
        const itemsPerPage = 10

        const cooldownsCount = await Cooldowns.count()

        if(cooldownsCount == 0)
            throw new CooldownEmptyError()
        
        const pageCount = Math.ceil(cooldownsCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const cooldowns = await Cooldowns.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        return {
            items: cooldowns,
            page,
            pageCount
        }
    },

    /**
     * Vérifie si le membre est en cooldown,
     * et si celui-ci spam, il est mute
     * @param {Message} message The created message
     */
    async check(message) {
        let cooldown = false

        const member = message.member
        const memberId = member.id
        const memberCooldown = await this.get(memberId)

        if(memberCooldown) {
            const date = new Date()

            const { timeThreshold, countThreshold, muteDuration, messageDate } = memberCooldown

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

            if(cooldown) {
                const guild = message.guild
                const muteRole = guild.roles.cache.find(r => r.id === config.guild.roles['Muted'])

                /** @type {TextChannel} */
                const logsChannel = guild.channels.cache.get(config.guild.channels['logs'])

                await member.roles.add(muteRole)

                setTimeout(async () => {
                    await member.roles.remove(muteRole)
                }, muteDuration * 1000)

                const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle('⏳ Spam détécté !')
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setDescription(`${userMention(member.id)} s'est pris un cooldown – ${hyperlink('Voir', message.url)}`)

                await logsChannel.send({ embeds: [embed] })

                try {
                    await member.send({ content: `Mollo l'asticot ! Évites de spammer s'il te plaît.\nPour la peine, tu es mute pendant ${muteDuration} seconde${muteDuration > 1 ? 's' : ''}.` })
                } catch(error) {
                    Logger.log('Cooldown', 'ERROR', `Le message privé à ${member.user.tag} n'a pas pu être envoyé`)
                }
            }
        }
    }
}