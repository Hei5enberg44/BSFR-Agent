import { GuildMember, Message, MessageReaction, CommandInteraction, TextChannel, User, userMention, roleMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { MaliciousURL, Reactions } from './database.js'
import { PageNotFoundError, MaliciousURLEmptyError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Ajoute un URL malveillant dans la base de données
     * @param {string} url URL malveillant
     * @param {GuildMember} member membre réalisant la demande d'ajout
     */
    async add(url, member) {
        await MaliciousURL.create({
            url: url.trim(),
            memberId: member.id
        })
    },

    /**
     * @typedef {Object} MaliciousURL
     * @property {number} id
     * @property {string} url
     * @property {string} memberId
     * @property {Date} date
     */

    /**
     * Récupère une liste d'URL malveillants par rapport à un ou plusieurs ids
     * @param {string} ids identifiant(s) des URL malveillants à récupérer
     * @returns {Promise<Array<MaliciousURL>>} liste des URL malveillants
     */
    async get(ids) {
        ids = ids.split(';').map(id => id.trim())

        const urlsList = await MaliciousURL.findAll({
            where: {
                id: ids
            }
        })

        return urlsList
    },

    /**
     * Test si un URL malveillant a été utilisé par un membre
     * @param {Message} message The created message
     */
    async test(message) {
        if(!message.author.bot) {
            const urlsList = await MaliciousURL.findAll()

            /** @type {TextChannel} */
            const logsChannel = message.guild.channels.cache.get(config.guild.channels['logs'])
            const muteRole = message.guild.roles.cache.get(config.guild.roles['Muted'])

            const urlsToTest = message.content.toLowerCase().replace('\n', ' ').split(' ').filter(w => w.match(/https?:\/\//))

            let usedMaliciousURL = []
            for(const url of urlsToTest) {
                const domain = url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+).*$/, '$1')
                if(urlsList.find(ul => ul.url === domain) && usedMaliciousURL.indexOf(url) === -1) {
                    usedMaliciousURL.push(url)
                }
            }

            if(usedMaliciousURL.length > 0) {
                Logger.log('MaliciousURL', 'INFO', `URL(s) malveillant(s) trouvé(s) dans un message de ${message.author.tag} : ${usedMaliciousURL.join(', ')}`)

                const embed = new Embed()
                    .setColor('#E74C3C')
                    .setTitle('⛔ Envoi d\'URL malveillant')
                    .setThumbnail(message.author.displayAvatarURL({ forceStatic: false }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(message.author.id) },
                        { name: 'Contenu du message', value: message.content }
                    )
                
                await message.delete()
                
                await logsChannel.send({ content: roleMention(config.guild.roles['Modérateur']), embeds: [embed] })

                await message.member.roles.add(muteRole)
            }
        }
    },

    /**
     * Retourne la liste des URL malveillants depuis la base de données
     * @param {number} page page à retourner
     * @returns {Promise<{items: Array<MaliciousURL>, page: number, pageCount: number}>} liste des URL malveillants
     */
    async list(page) {
        const itemsPerPage = 10

        const urlCount = await MaliciousURL.count()

        if(urlCount == 0)
            throw new MaliciousURLEmptyError()
        
        const pageCount = Math.ceil(urlCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const urls = await MaliciousURL.findAll({
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
    },

    /**
     * Ajout d'une requête de suppression d'URL malveillants dans la base de données
     * @param {Array<MaliciousURL>} urlsList liste des URL malveillants à supprimer
     * @param {CommandInteraction} interaction interaction Discord
     * @param {string} messageId identifiant du message de confirmation de suppression
     */
    async remove(urlsList, interaction, messageId) {
        await Reactions.create({
            type: 'removeMaliciousURL',
            data: urlsList,
            interaction: {
                locale: interaction.locale,
                commandName: interaction.commandName,
                memberId: interaction.user.id,
                channelId: interaction.channel.id
            },
            messageId: messageId
        })
    },

    /**
     * @typedef {Object} Reaction
     * @property {number} id
     * @property {string} type
     * @property {Array<MaliciousURL>} data
     * @property {{locale: string, commandName: string, memberId: string, channelId: string}} interaction
     * @property {string} messageId
     * @property {Date} date
     */

    /**
     * Supression d'URL malveillant
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {Reaction} r données concernant la réaction
     */
    async confirmRemove(reaction, user, r) {
        if(r.interaction.memberId === user.id) {
            const embed = new Embed()
                .setThumbnail(user.displayAvatarURL({ forceStatic: false }))
                .addFields({ name: Locales.get(r.interaction.locale, 'member'), value: userMention(user.id) })

            if(reaction.emoji.name === '✅') {
                const ids = r.data.map(url => url.id)
                await MaliciousURL.destroy({ where: { id: ids } })
                await Reactions.destroy({ where: { id: r.id } })

                Logger.log('MaliciousURL', 'INFO', `${user.tag} a supprimé les URL malveillants suivants : ${r.data.map(url => url.url).join(', ')}`)

                embed.setColor('#2ECC71')
                    .setTitle(Locales.get(r.interaction.locale, 'delete_malicious_urls'))
                    .addFields({ name: Locales.get(r.interaction.locale, 'deleted_malicious_urls'), value: r.data.map(url => url.url).join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            } else if(reaction.emoji.name === '❌') {
                await Reactions.destroy({ where: { id: r.id } })

                embed.setColor('#E74C3C')
                    .setTitle(Locales.get(r.interaction.locale, 'delete_malicious_urls_refusal'))
                    .addFields({ name: Locales.get(r.interaction.locale, 'undeleted_malicious_urls'), value: r.data.map(url => url.url).join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            }
        } else {
            await reaction.users.remove(user)
        }
    }
}