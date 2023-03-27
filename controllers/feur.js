import { Message } from 'discord.js'
import crypto from 'crypto'
import { Feur } from './database.js'
import Logger from '../utils/logger.js'

const regex = new RegExp(/[cqk]+(?:[uúùûü]*w+[uúùûü]*[aáàâäãå]+|[uúùûü]*[eéèêë]*[oóòôöõ]+[iíìîïaáàâäãå]+|[oóòôöõ]+[uúùûü]+[aáàâäãå]+)/, 'igm')
const exceptions = [ 'aquoibonisme', 'aquoibonismes', 'aquoiboniste', 'aquoibonistes', 'carquois', 'claquoir', 'claquoirs', 'dacquois', 'dacquoise', 'dacquoises', 'dunkerquois', 'dunkerquoise', 'dunkerquoises', 'iroquoien', 'iroquoienne', 'iroquoiennes', 'iroquoiens', 'iroquois', 'iroquoise', 'iroquoises', 'lucquois', 'lucquoise', 'lucquoises', 'marquoir', 'marquoirs', 'narquois', 'narquoise', 'narquoisement', 'narquoises', 'piquoir', 'piquoirs', 'pourquoi', 'quoi', 'quoique', 'rufisquois', 'rufisquoise', 'rufisquoises', 'sequoia', 'sequoias', 'taquoir', 'taquoirs', 'turquoise', 'turquoises' ]

export default {
    isException(word) {
        if(word.length > 6 && word.length < 15 && exceptions.find(e => e === word.toLowerCase())) 
            return true
        return false
    },

    /**
     * Répond "feur" si "quoi" est détécté en fin de phrase
     * (crédit: Vred#0001)
     * @param {Message} message The created message
     */
    async feur(message) {
        const random = crypto.randomInt(15)
        const sentence = message.content.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '')

        let match
        while((match = regex.exec(sentence)) !== null) {
            let startIndex = sentence.substring(0, match.index).lastIndexOf(' ') + 1
            if(startIndex === 0) startIndex = 0

            let endIndex = regex.lastIndex + sentence.substring(regex.lastIndex).indexOf(' ') + 1
            if(endIndex === regex.lastIndex) endIndex = sentence.length

            const word = sentence.substring(startIndex, endIndex).trim()
            if(!this.isException(word) && random === 0) {
                await message.reply({ content: 'feur', allowedMentions: { repliedUser: false } })
                Logger.log('Feur', 'INFO', `Agent a répondu "feur" à ${message.author.tag}`)
                break
            }
        }
    },

    /**
     * Enregistre les réponses "feur" à des messages contenant "quoi" dans la base de données
     * @param {Message} message The created message
     */
    async feurLeaderboard(message) {
        const messageSplit = message.content.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
        if(message.reference && messageSplit.find(m => m.toLowerCase() === 'feur')) {
            const channelReference = message.guild.channels.cache.find(c => c.id === message.reference.channelId)
            const messageReference = await channelReference.messages.fetch(message.reference.messageId)

            if(messageReference.author.id === message.author.id || messageReference.createdTimestamp + 86400000 < Date.now()) return false

            const sentence = messageReference.content.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '')

            let match
            while((match = regex.exec(sentence)) !== null) {
                let startIndex = sentence.substring(0, match.index).lastIndexOf(' ') + 1
                if(startIndex === 0) startIndex = 0

                let endIndex = regex.lastIndex + sentence.substring(regex.lastIndex).indexOf(' ') + 1
                if(endIndex === regex.lastIndex) endIndex = sentence.length

                const word = sentence.substring(startIndex, endIndex).trim()
                if(!this.isException(word)) {
                    const feured = await Feur.findOne({
                        where: {
                            victimId: messageReference.author.id,
                            messageId: messageReference.id
                        }
                    })
                    if(!feured) {
                        await Feur.create({
                            attackerId: message.author.id,
                            victimId: messageReference.author.id,
                            messageId: messageReference.id,
                            message: messageReference.content,
                            messageDate: new Date(messageReference.createdTimestamp),
                            responseId: message.id,
                            response: message.content,
                            responseDate: new Date(message.createdTimestamp)
                        })
                        await message.react('✂️')
                        Logger.log('Feur', 'INFO', `${message.author.tag} a répondu "feur" à ${messageReference.author.tag}`)
                    }
                    break
                }
            }
        }
    }
}