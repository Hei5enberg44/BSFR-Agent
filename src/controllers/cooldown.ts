import { Guild, GuildMember, Message, TextChannel, userMention, hyperlink } from 'discord.js'
import Embed from '../utils/embed.js'
import { CooldownModel } from './database.js'
import { PageNotFoundError, CooldownEmptyError } from '../utils/error.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

interface CooldownItemsPage {
    items: CooldownModel[],
    page: number,
    pageCount: number
}

export default class Cooldowns {
    /**
     * Ajoute un membre en cooldown
     * @param memberId identifiant du membre Discord
     * @param timeThreshold laps de temps entre le premier et le dernier message envoyé (en secondes)
     * @param countThreshold nombre de messages envoyés dans le laps de temps
     * @param muteDuration durée du mute du membre (en secondes)
     */
    static async add(memberId: string, timeThreshold: number, countThreshold: number, muteDuration: number) {
        await CooldownModel.create({
            memberId,
            timeThreshold,
            countThreshold,
            muteDuration
        })
    }

    /**
     * Récupère un membre en cooldown
     * @param memberId identifiant du membre Discord
     * @returns informations du cooldown
     */
    static async get(memberId: string) {
        const memberCooldown = await CooldownModel.findOne({
            where: { memberId }
        })
        return memberCooldown
    }

    /**
     * Supprime le cooldown d'un membre
     * @param memberId identifiant du membre Discord
     */
    static async remove(memberId: string) {
        await CooldownModel.destroy({
            where: { memberId }
        })
    }

    /**
     * Retourne la liste des cooldowns depuis la base de données
     * @param page page à retourner
     * @returns liste des cooldowns
     */
    static async list(page: number): Promise<CooldownItemsPage> {
        const itemsPerPage = 10

        const cooldownsCount = await CooldownModel.count()

        if(cooldownsCount == 0)
            throw new CooldownEmptyError()
        
        const pageCount = Math.ceil(cooldownsCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const cooldowns = await CooldownModel.findAll({
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
    }

    /**
     * Vérifie si le membre est en cooldown,
     * et si celui-ci spam, il est mute
     * @param message The created message
     */
    static async check(message: Message) {
        let cooldown = false

        const member = <GuildMember>message.member
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
                const guild = <Guild>message.guild
                const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])

                await member.timeout(muteDuration * 1000, 'cooldown')

                const embed = new Embed()
                    .setColor('#2ECC71')
                    .setTitle('⏳ Spam détécté !')
                    .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                    .setDescription(`${userMention(member.id)} s'est pris un cooldown – ${hyperlink('Voir', message.url)}`)

                await logsChannel.send({ embeds: [embed] })

                try {
                    await member.send({ content: `Mollo l'asticot ! Évites de spammer s'il te plaît.\nPour la peine, tu es timeout pendant ${muteDuration} seconde${muteDuration > 1 ? 's' : ''}.` })
                } catch(error) {
                    Logger.log('Cooldown', 'ERROR', `Le message privé à ${member.user.tag} n'a pas pu être envoyé`)
                }
            }
        }
    }
}