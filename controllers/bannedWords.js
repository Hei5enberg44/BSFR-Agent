const { GuildMember, Message, MessageReaction, User, userMention, roleMention, hyperlink } = require("discord.js")
const Embed = require('../utils/embed')
const { BannedWordsError } = require('../utils/error')
const { BannedWords, Reactions } = require('./database')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un/plusieurs mots bannis dans la base de données
     * @param {string} words liste des mots bannis (séparés par un point virgules si plusieurs mots)
     * @param {GuildMember} member membre réalisant la demande d'ajout
     * @returns {Promise<{new: Array<string>, old: Array<string>}>} liste des mots bannis
     */
    add: async function(words, member) {
        const wordsList = words.split(';')
        const result = {
            new: [],
            old: []
        }

        for(let word of wordsList) {
            word = word.trim()

            const exists = await BannedWords.count({ where: { word: word } })

            if(exists === 0) {
                await BannedWords.create({
                    word: word,
                    memberId: member.id
                })

                result.new.push(word)
            } else {
                result.old.push(word)
            }
        }

        return result
    },

    /**
     * Récupère une liste de mots bannis par rapport à un ou plusieurs ids
     * @param {string} ids identifiant(s) des mots bannis à récupérer
     * @returns {Promise<Array<{id: number, word: string, memberId: string, date: Date}>>} liste des mots bannis
     */
    get: async function(ids) {
        ids = ids.split(';').map(id => id.trim())

        const wordsList = await BannedWords.findAll({
            where: {
                id: ids
            },
            raw: true
        })

        return wordsList
    },

    /**
     * Test si un mot banni a été utilisé par un membre
     * @param {Message} message The created message
     */
    test: async function(message) {
        if(!message.author.bot) {
            const bannedWordsList = await BannedWords.findAll()
            const logsChannel = message.guild.channels.cache.get(config.guild.channels.logs)

            let usedBannedWords = []
            for(const bannedWord of bannedWordsList) {
                if(message.content.toLowerCase().includes(bannedWord.word.toLowerCase()) && usedBannedWords.indexOf(bannedWord.word) === -1) {
                    usedBannedWords.push(bannedWord.word)
                }
            }

            if(usedBannedWords.length > 0) {
                Logger.log('BannedWords', 'INFO', `Mot(s) banni(s) trouvé(s) dans un message de ${message.author.tag} : ${usedBannedWords.join(', ')}`)

                const embed = new Embed()
                    .setColor('#E74C3C')
                    .setTitle('⛔ Usage de mots bannis')
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(message.author.id) },
                        { name: 'Les mots interdits utilisés', value: usedBannedWords.join(', ') },
                        { name: 'Message', value: hyperlink('Lien', message.url) }
                    )
                
                await logsChannel.send({ content: roleMention(config.guild.roles['Modérateur']), embeds: [embed] })
            }
        }
    },

    /**
     * Retourne la liste des mots bannis depuis la base de données
     * @param {number} page page à retourner
     * @returns {Promise<string>} liste des mots bannis
     */
    list: async function(page) {
        const itemsPerPage = 10

        const wordsCount = await BannedWords.count()

        if(wordsCount == 0)
            throw new BannedWordsError('Il n\'y a aucun mot banni pour le moment.')
        
        const pageCount = Math.ceil(wordsCount / itemsPerPage)

        if(page > pageCount)
            throw new BannedWordsError('La page demandée n\'existe pas.')

        const words = await BannedWords.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        let wordsList = ''
        for(const word of words) {
            wordsList += `${word.id} - ${word.word}\n`
        }

        const pageInfo = `Page \`${page}\` sur \`${pageCount}\``

        return wordsList + '\n' + pageInfo
    },

    /**
     * Ajout d'une requête de suppression de mots bannis dans la base de données
     * @param {Object} wordsList liste des mots bannis à supprimer
     * @param {string} memberId identifiant du membre ayant effectué la demande de suppression
     * @param {string} channelId identifiant du salon dans lequel la demande de suppression a été effectuée
     * @param {string} messageId identifiant du message de confirmation de suppression
     */
    remove: async function(wordsList, memberId, channelId, messageId) {
        await Reactions.create({
            type: 'removeBannedWord',
            data: wordsList,
            memberId: memberId,
            channelId: channelId,
            messageId: messageId
        })
    },

    /**
     * @typedef {Object} Reaction
     * @property {number} id
     * @property {string} type
     * @property {{id: number, word: string, memberId: string, date: Date}} data
     * @property {string} memberId
     * @property {string} channelId
     * @property {string} messageId
     * @property {Date} date
     */

    /**
     * Confirmation de la suppression des mots bannis
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {Reaction} r données concernant la réaction
     */
    confirmRemove: async function(reaction, user, r) {
        const embed = new Embed()
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields({ name: 'Membre', value: user.tag })

        if(reaction.emoji.name === '✅') {
            const ids = r.data.map(word => word.id)
            await BannedWords.destroy({ where: { id: ids } })
            await Reactions.destroy({ where: { id: r.id } })

            Logger.log('BannedWords', 'INFO', `${user.tag} a supprimé les mots bannis suivants : ${r.data.map(word => word.word).join(', ')}`)

            embed.setColor('#2ECC71')
                .setTitle('🗑️ Suppression de mots bannis')
                .addFields({ name: 'Mots bannis supprimés', value: r.data.map(word => word.word).join('\n') })

            await reaction.message.reactions.removeAll()
            await reaction.message.edit({ embeds: [embed] })
        } else if(reaction.emoji.name === '❌') {
            await Reactions.destroy({ where: { id: r.id } })

            embed.setColor('#E74C3C')
                .setTitle('🗑️ Refus de suppression de mots bannis')
                .addFields({ name: 'Mots bannis non supprimés', value: r.data.map(word => word.word).join('\n') })

            await reaction.message.reactions.removeAll()
            await reaction.message.edit({ embeds: [embed] })
        }
    }
}