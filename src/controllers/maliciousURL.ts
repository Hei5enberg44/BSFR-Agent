import { Guild, GuildMember, Message, MessageReaction, CommandInteraction, TextChannel, User, userMention, roleMention, LocaleString } from 'discord.js'
import Embed from '../utils/embed.js'
import { MaliciousURLModel, ReactionModel, MaliciousURLReactionData } from './database.js'
import reactions, { ReactionType } from './reactions.js'
import { PageNotFoundError, MaliciousURLEmptyError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

interface MaliciousURLItemsPage {
    items: MaliciousURLModel[],
    page: number,
    pageCount: number
}

export default class MaliciousURL {
    /**
     * Ajoute un URL malveillant dans la base de données
     * @param url URL malveillant
     * @param member membre réalisant la demande d'ajout
     */
    static async add(url: string, member: GuildMember) {
        await MaliciousURLModel.create({
            url: url.trim(),
            memberId: member.id
        })
    }

    /**
     * Récupère une liste d'URL malveillants par rapport à un ou plusieurs ids
     * @param ids identifiant(s) des URL malveillants à récupérer
     * @returns liste des URL malveillants
     */
    static async get(ids: string) {
        const idList = ids.split(';').map(id => id.trim())
        const urlsList = await MaliciousURLModel.findAll({
            where: {
                id: idList
            }
        })
        return urlsList
    }

    /**
     * Test si un URL malveillant a été utilisé par un membre
     * @param message The created message
     */
    static async test(message: Message) {
        if(!message.author.bot) {
            const urlsToTest = message.content.toLowerCase().replace('\n', ' ').split(' ').filter(w => w.match(/^https?:\/\//))

            let usedMaliciousURL = []
            for(const url of urlsToTest) {
                const domain = url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+).*$/, '$1')
                const isMalicious = await MaliciousURLModel.findOne({ where: { url: domain } })
                if(isMalicious !== null && usedMaliciousURL.indexOf(url) === -1) {
                    usedMaliciousURL.push(url)
                }
            }

            usedMaliciousURL = [
                ...usedMaliciousURL,
                ...(this.runSpecificTests(message))
            ]

            if(usedMaliciousURL.length > 0) {
                Logger.log('MaliciousURL', 'INFO', `URL(s) malveillant(s) trouvé(s) dans un message de ${message.author.username} : ${usedMaliciousURL.join(', ')}`)

                const embed = new Embed()
                    .setColor('#E74C3C')
                    .setTitle('⛔ Envoi d\'URL malveillant')
                    .setThumbnail(message.author.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(message.author.id) },
                        { name: 'Contenu du message', value: message.content }
                    )
                
                await message.delete()
                
                const guild = <Guild>message.guild
                const logsChannel = guild.channels.cache.get(config.guild.channels['logs']) as TextChannel | undefined
                logsChannel && await logsChannel.send({ content: roleMention(config.guild.roles['Modérateur']), embeds: [embed] })

                const member = message.member

                if(member) {
                    try {
                        await member.timeout(5 * 24 * 60 * 60 * 1000, 'Envoi d\'URL malveillant') // Timeout 5 jours
                    } catch(error) {
                        Logger.log('MaliciousURL', 'ERROR', `Impossible de timeout le membre ${member.user.username} (${error.message})`)
                    }
                }
            }
        }
    }

    /**
     * Tests spécifiques
     * @param message The created message
     */
    private static runSpecificTests(message: Message) {
        const usedMaliciousURL = message.content.toLowerCase().replace('\n', ' ').split(' ').filter(w => w.match(/^\[(https?:\/\/)?(steamcommunity\.com)[^\]]+\]\(https?:\/\/[^\)]+\)$/))
        return usedMaliciousURL
    }

    /**
     * Retourne la liste des URL malveillants depuis la base de données
     * @param page page à retourner
     * @returns liste des URL malveillants
     */
    static async list(page: number): Promise<MaliciousURLItemsPage> {
        const itemsPerPage = 10

        const urlCount = await MaliciousURLModel.count()

        if(urlCount == 0)
            throw new MaliciousURLEmptyError()
        
        const pageCount = Math.ceil(urlCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const urls = await MaliciousURLModel.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        return {
            items: urls,
            page,
            pageCount
        }
    }

    /**
     * Ajout d'une requête de suppression d'URL malveillants dans la base de données
     * @param urlsList liste des URL malveillants à supprimer
     * @param interaction interaction Discord
     * @param messageId identifiant du message de confirmation de suppression
     */
    static async remove(urlsList: MaliciousURLModel[], interaction: CommandInteraction, messageId: string) {
        await reactions.add(
            ReactionType.RemoveMaliciousURL,
            urlsList,
            {
                locale: interaction.locale,
                commandName: interaction.commandName,
                memberId: interaction.user.id,
                channelId: (<TextChannel>interaction.channel).id
            },
            messageId
        )
    }

    /**
     * Supression d'URL malveillant
     * @param reaction The reaction object
     * @param user The user that applied the guild or reaction emoji
     * @param r données concernant la réaction
     */
    static async confirmRemove(reaction: MessageReaction, user: User, r: ReactionModel<MaliciousURLReactionData[]>) {
        if(r.interaction.memberId === user.id) {
            const embed = new Embed()
                .setThumbnail(user.displayAvatarURL({ forceStatic: false }))
                .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'member'), value: userMention(user.id) })

            const ids = r.data.map(url => url.id)
            const urls = r.data.map(url => url.url)

            if(reaction.emoji.name === '✅') {
                await MaliciousURLModel.destroy({ where: { id: ids } })
                await ReactionModel.destroy({ where: { id: r.id } })

                Logger.log('MaliciousURL', 'INFO', `${user.username} a supprimé les URL malveillants suivants : ${urls.join(', ')}`)

                embed.setColor('#2ECC71')
                    .setTitle(Locales.get(<LocaleString>r.interaction.locale, 'delete_malicious_urls'))
                    .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'deleted_malicious_urls'), value: urls.join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            } else if(reaction.emoji.name === '❌') {
                await ReactionModel.destroy({ where: { id: r.id } })

                embed.setColor('#E74C3C')
                    .setTitle(Locales.get(<LocaleString>r.interaction.locale, 'delete_malicious_urls_refusal'))
                    .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'undeleted_malicious_urls'), value: urls.join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            }
        } else {
            await reaction.users.remove(user)
        }
    }
}