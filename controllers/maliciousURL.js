const { GuildMember, Message, MessageReaction, User, userMention, roleMention } = require("discord.js")
const Embed = require('../utils/embed')
const { MaliciousURLError } = require('../utils/error')
const { MaliciousURL, Reactions } = require('./database')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un URL malveillant dans la base de données
     * @param {String} url URL malveillant
     * @param {GuildMember} member membre réalisant la demande d'ajout
     * @returns {Promise<{new: String, old: String}>} liste des URL malveillants
     */
    add: async function(url, member) {
        url = url.trim()

        const result = {
            new: '',
            old: ''
        }

        const exists = await MaliciousURL.count({ where: { url: url } })

        if(exists === 0) {
            await MaliciousURL.create({
                url: url,
                memberId: member.id
            })

            result.new = url
        } else {
            result.old = url
        }

        return result
    },

    /**
     * Récupère une liste d'URL malveillants par rapport à un ou plusieurs ids
     * @param {String} ids identifiant(s) des URL malveillants à récupérer
     * @returns {Promise<Array.<{id: Number, url: String, memberId: String, date: Date}>>} liste des URL malveillants
     */
    get: async function(ids) {
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
    test: async function(message) {
        if(!message.author.bot) {
            const urlsList = await MaliciousURL.findAll()
            const logsChannel = message.guild.channels.cache.get(config.guild.channels.logs)
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
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
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
     * @param {Number} page page à retourner
     * @returns {Promise<String>} liste des URL malveillants
     */
    list: async function(page) {
        const itemsPerPage = 10

        const urlCount = await MaliciousURL.count()

        if(urlCount == 0)
            throw new MaliciousURLError('Il n\'y a aucun URL malveillant pour le moment.')
        
        const pageCount = Math.ceil(urlCount / itemsPerPage)

        if(page > pageCount)
            throw new MaliciousURLError('La page demandée n\'existe pas.')

        const urls = await MaliciousURL.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let urlsList = ''
        for(const url of urls) {
            urlsList += `${url.id} - ${url.url}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return urlsList + '\n' + pageInfo
    },

    /**
     * Ajout d'une requête de suppression d'URL malveillants dans la base de données
     * @param {Object} urlsList liste des URL malveillants à supprimer
     * @param {String} memberId identifiant du membre ayant effectué la demande de suppression
     * @param {String} channelId identifiant du salon dans lequel la demande de suppression a été effectuée
     * @param {String} messageId identifiant du message de confirmation de suppression
     */
    remove: async function(urlsList, memberId, channelId, messageId) {
        await Reactions.create({
            type: 'removeMaliciousURL',
            data: urlsList,
            memberId: memberId,
            channelId: channelId,
            messageId: messageId
        })
    },

    /**
     * Supression d'URL malveillant
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {{id: Number, type: String, data: Array.<{id: Number, url: String, memberId: String, date: Date}>, memberId: String, channelId: String, messageId: String, date: Date}} r données concernant la réaction
     */
    confirmRemove: async function(reaction, user, r) {
        const embed = new Embed()
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields({ name: 'Membre', value: user.tag })

        if(reaction.emoji.name === '✅') {
            const ids = r.data.map(url => url.id)
            await MaliciousURL.destroy({ where: { id: ids } })
            await Reactions.destroy({ where: { id: r.id } })

            Logger.log('MaliciousURL', 'INFO', `${user.tag} a supprimé les URL malveillants suivants : ${r.data.map(url => url.url).join(', ')}`)

            embed.setColor('#2ECC71')
                .setTitle('🗑️ Suppression d\'URL malveillants')
                .addFields({ name: 'URL malveillants supprimés', value: r.data.map(url => url.url).join('\n') })

            await reaction.message.reactions.removeAll()
            await reaction.message.edit({ embeds: [embed] })
        } else if(reaction.emoji.name === '❌') {
            await Reactions.destroy({ where: { id: r.id } })

            embed.setColor('#E74C3C')
                .setTitle('🗑️ Refus de suppression d\'URL malveillants')
                .addFields({ name: 'URL malveillants non supprimés', value: r.data.map(url => url.url).join('\n') })

            await reaction.message.reactions.removeAll()
            await reaction.message.edit({ embeds: [embed] })
        }
    }
}