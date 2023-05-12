import { Message } from 'discord.js'
import crypto from 'crypto'
import Logger from '../utils/logger.js'

export default {
    /**
     * Répond "feur" si "quoi" est détécté en fin de phrase
     * (crédit: Vred#0001)
     * @param message The created message
     */
    async feur(message: Message) {
        const random = crypto.randomInt(15)
        if(message.content.match(/(^|.+\s)quoi(\s\?|\?)?$/i) && random === 0) {
            message.reply({ content: 'feur', allowedMentions: { repliedUser: false } })
            Logger.log('Feur', 'INFO', `Agent a répondu "feur" à ${message.author.tag}`)
        }
    }
}