const { Client, MessageReaction, User, time } = require('discord.js')
const Embed = require('../utils/embed')
const { Reactions, Polls, PollsVotes } = require('./database')
const { Op } = require('sequelize')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Créer un sondage
     * @param {string} title titre du sondage
     * @param {string[]} propositions liste des propositions
     * @param {string[]|null} customEmojis liste des emojis personnalisés
     * @param {number} dateEnd date de fin du sondage
     * @param {string} memberId membre à l'origine de la création du sondage
     * @param {string} channelId identifiant du channel où a été envoyé le sondage
     * @param {string} messageId identifiant du message contenant le sondage
     */
    create: async function(title, propositions, customEmojis, dateEnd, memberId, channelId, messageId) {
        const poll = await Polls.create({
            title: title,
            propositions: propositions,
            emojis: customEmojis || defaultEmojis.splice(propositions.length),
            dateEnd: Math.floor(dateEnd / 1000),
            createdBy: memberId,
            channelId: channelId,
            messageId: messageId
        })

        await Reactions.create({
            type: 'pollVote',
            data: {
                pollId: poll.id
            },
            memberId: memberId,
            channelId: channelId,
            messageId: messageId
        })
    },

    /**
     * @typedef {Object} Reaction
     * @property {number} id
     * @property {string} type
     * @property {{pollId: number}} data
     * @property {string} memberId
     * @property {string} channelId
     * @property {string} messageId
     * @property {Date} date
     */

    /**
     * Ajout d'un vote sur un sondage
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user that applied the guild or reaction emoji
     * @param {Reaction} r données concernant la réaction
     */
    vote: async function(reaction, user, r) {
        const pollId = r.data.pollId
        const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name

        const poll = await Polls.findOne({
            where: {
                id: pollId
            }
        })

        if(poll) {
            if(poll.emojis.find(e => e === emoji)) {
                const votes = await PollsVotes.findAll({
                    where: {
                        pollId: pollId
                    }
                })

                if(!votes.find(v => v.memberId === user.id)) {
                    const vote = await PollsVotes.create({
                        pollId: pollId,
                        memberId: user.id,
                        vote: emoji
                    })

                    votes.push(vote)

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setTitle(poll.title)
                        .setDescription(poll.propositions.map((p, i) => {
                            const nbVotes = votes.filter(v => v.vote === poll.emojis[i]).length
                            const percent = Math.round(nbVotes * 100 / votes.length)
                            return `${poll.emojis[i]} : ${p} (${percent}% - ${nbVotes} ${nbVotes > 1 ? 'votes' : 'vote'})`
                        }).join('\n') + `\n\nDate de fin: ${time(new Date(poll.dateEnd * 1000))}`)

                    await reaction.message.edit({ embeds: [embed] })
                }
            }
        }

        await reaction.users.remove(user)
    },

    /**
     * Supprime les réactions pour les sondages terminés
     * @param {Client} client client Discord
     */
    finish: async function(client) {
        const guild = client.guilds.cache.get(config.guild.id)

        const polls = await Polls.findAll({
            where: {
                dateEnd: {
                    [Op.lte]: Math.floor(Date.now() / 1000)
                }
            }
        })

        for(const poll of polls) {
            const votes = await PollsVotes.findAll({
                where: { pollId: poll.id }
            })

            await Reactions.destroy({
                where: { 'data.pollId': poll.id }
            })
            await PollsVotes.destroy({
                where: { pollId: poll.id }
            })
            await poll.destroy()

            const pollChannel = guild.channels.cache.get(poll.channelId)
            if(pollChannel) {
                try {
                    const pollMessage = await pollChannel.messages.fetch(poll.messageId)
                    await pollMessage.reactions.removeAll()
                } catch(error) {
                    Logger.log('Poll', 'ERROR', 'Impossible de supprimer les réactions sur le message du sondage')
                }
            }

            const logChannel = guild.channels.cache.get(config.guild.channels.logs)

            const embed = new Embed()
                .setColor('#F1C40F')
                .setTitle(poll.title)
                .setDescription(poll.propositions.map((p, i) => {
                    const nbVotes = votes.filter(v => v.vote === poll.emojis[i]).length
                    const percent = Math.round(nbVotes * 100 / votes.length)
                    return `${poll.emojis[i]} : ${p} (${percent}% - ${nbVotes} ${nbVotes > 1 ? 'votes' : 'vote'})`
                }).join('\n'))

            await logChannel.send({ content: 'Un sondage vient de se terminer, voici les résultats :', embeds: [embed] })
        }
    }
}