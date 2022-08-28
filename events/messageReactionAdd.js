const { MessageReaction, User } = require('discord.js')
const { Reactions } = require('../controllers/database')
const { Op } = require('sequelize')
const rules = require('../controllers/rules')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const maliciousURL = require('../controllers/maliciousURL')
const ban = require('../controllers/ban')

module.exports = {
    /**
     * Emitted whenever a reaction is added to a cached message
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     */
    async execute(reaction, user) {
        if(reaction.partial)
            await reaction.fetch()

        const r = await Reactions.findOne({
            where: {
                [Op.and]: [
                    { channelId: reaction.message.channelId },
                    { messageId: reaction.message.id }
                ]
            }
        })

        if(r && !user.bot) {
            const type = r.type

            switch(type) {
                // Attribution de rôle après acceptation des règles
                case 'rules':
                    await rules.accept(reaction, user)
                    break
                // Supression de mots bannis
                case 'removeBannedWord':
                    await bannedWords.confirmRemove(reaction, user, r)
                    break
                // Supression de messages d'anniversaire
                case 'removeBirthdayMessage':
                    await birthdayMessages.confirmRemove(reaction, user, r)
                    break
                // Supression d'URL malveillants
                case 'removeMaliciousURL':
                    await maliciousURL.confirmRemove(reaction, user, r)
                    break
                // Confirmation de bannissement d'un membre
                case 'banRequest':
                    await ban.ban(reaction, user, r)
                    break
            }
        }
    }
}