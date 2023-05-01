import { Message, userMention, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import { CooldownError } from '../utils/error.js'
import { Cooldowns } from './database.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un utilisateur en cooldown
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
     * @typedef {object} MemberCooldown
     * @property {number} id
     * @property {string} memberId
     * @property {number} timeThreshold
     * @property {number} countThreshold
     * @property {number} muteDuration
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
     * Retourne la liste des cooldowns depuis la base de données
     * @param {number} page page à retourner
     * @returns {Promise<string>} liste des cooldowns
     */
    async list(page) {
        const itemsPerPage = 10

        const cooldownsCount = await Cooldowns.count()

        if(cooldownsCount == 0)
            throw new CooldownError('Il n\'y a aucun cooldown pour le moment.')
        
        const pageCount = Math.ceil(cooldownsCount / itemsPerPage)

        if(page > pageCount)
            throw new CooldownError('La page demandée n\'existe pas.')

        const cooldowns = await Cooldowns.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let cooldownList = ''
        for(const cooldown of cooldowns) {
            cooldownList += `${userMention(cooldown.memberId)} (Seuil temps: **${cooldown.timeThreshold}s**, Seuil nombre: **${cooldown.countThreshold}**, Durée mute: **${cooldown.muteDuration}s**)\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return cooldownList + '\n' + pageInfo
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

                const logsChannel = guild.channels.cache.get(config.guild.channels.logs)

                try {
                    await member.roles.add(muteRole)
                    await member.send({ content: `Mollo l'asticot ! Évites de spammer s'il te plaît.\nPour la peine, tu es mute pendant ${muteDuration} seconde${muteDuration > 1 ? 's' : ''}.` })

                    const embed = new Embed()
                            .setColor('#2ECC71')
                            .setTitle('⏳ Spam détécté !')
                            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                            .setDescription(`${userMention(member.id)} s'est pris un cooldown – ${hyperlink('Voir', message.url)}`)

                    await logsChannel.send({ embeds: [embed] })

                    setTimeout(async () => {
                        await member.roles.remove(muteRole)
                    }, muteDuration * 1000)
                } catch(e) {
                    console.log(e)
                }
            }
        }
    }
}