const { MessageReaction, User, userMention } = require('discord.js')
const Embed = require('../utils/embed')
const Twit = require('twit')
const { Tweets, Reactions } = require('./database')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un tweet dans la base de données
     * @param {String} memberId identifiant du membre réalisant la demande d'envoi de tweet
     * @param {String} tweet tweet à envoyer
     * @param {String} channelId identifiant du channel depuis lequel a été exécuté la commande de tweet
     * @param {String} messageId identifiant du message de confirmation d'envoi de tweet
     */
    add: async function(memberId, tweet, channelId, messageId) {
        const t = await Tweets.create({
            memberId: memberId,
            tweet: tweet
        })

        await Reactions.create({
            type: 'tweetRequest',
            data: {
                tweetId: t.id
            },
            memberId: memberId,
            channelId: channelId,
            messageId: messageId
        })
    },

    /**
     * Récupère les informations d'un tweet par rapport à son identifiant
     * @param {Number} tweetId identifiant du tweet
     * @returns {Promise<{id: Number, memberId: String, tweet: String}>} informations du tweet
     */
     get: async function(tweetId) {
        const tweet = await Tweets.findOne({
            where: {
                id: tweetId
            }
        })

        return tweet
    },

    /**
     * Confirmation de l'envoi d'un tweet
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {{id: Number, type: String, data: {tweetId: Number}, memberId: String, channelId: String, messageId: String, date: Date}} r données concernant la réaction
     */
    confirm: async function(reaction, user, r) {
        const tweetId = r.data.tweetId
        const tweetInfos = await module.exports.get(tweetId)

        const guild = reaction.client.guilds.cache.get(config.guild.id)
        const logsChannel = guild.channels.cache.get(config.guild.channels.logs)

        if(reaction.emoji.name === '✅') {
            const embed = new Embed()
                .addFields(
                    { name: 'Par', value: userMention(user.id) },
                    { name: 'Tweet', value: tweetInfos.tweet }
                )

            await Reactions.destroy({ where: { id: r.id } })

            try {
                await module.exports.send(tweetInfos.tweet)
                embed.setColor('#2ECC71').setTitle('✉️ Envoi d\'un tweet')
                Logger.log('Twitter', 'INFO', `Le tweet de ${user.tag} a été envoyé`)
            } catch(error) {
                embed.setColor('#E74C3C').setTitle('✉️ Échec d\'envoi d\'un tweet')
                Logger.log('Twitter', 'ERROR', `Échec de l'envoi du tweet de ${user.tag} : ${error.message}`)
            }

            await logsChannel.send({ embeds: [embed] })

            await reaction.message.delete()
        } else if(reaction.emoji.name === '❌') {
            const embed = new Embed()
                .setColor('#E74C3C')
                .setTitle('✉️ Refus d\'envoi d\'un tweet')
                .addFields(
                    { name: 'Par', value: userMention(user.id) },
                    { name: 'Tweet', value: tweetInfos.tweet }
                )

            await Reactions.destroy({ where: { id: r.id } })

            await logsChannel.send({ embeds: [embed] })

            await reaction.message.delete()
        }
    },

    /**
     * Envoi d'un tweet
     * @param {String} tweet tweet à envoyer
     */
    send: async function(tweet) {
        const T = new Twit({
            consumer_key: config.twitter.appKey,
            consumer_secret: config.twitter.appSecret,
            access_token: config.twitter.accessToken,
            access_token_secret: config.twitter.accessSecret
        })
    
        await T.post('statuses/update', { status: tweet })
    }
}