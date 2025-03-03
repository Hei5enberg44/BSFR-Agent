import { Client, Guild, GuildMember, MessageReaction, User, TextChannel, time, TimestampStyles, userMention, bold } from 'discord.js'
import Embed from '../utils/embed.js'
import { PollModel, PollVoteModel, ReactionModel, PollReactionData } from './database.js'
import reactions, { ReactionType } from './reactions.js'
import { Op } from 'sequelize'
import Logger from '../utils/logger.js'
import config from '../config.json' with { type: 'json' }

export default class Polls {
    /**
     * Créer un sondage
     * @param title titre du sondage
     * @param propositions liste des propositions
     * @param emojis liste des emojis
     * @param dateEnd date de fin du sondage
     * @param memberId membre à l'origine de la création du sondage
     * @param channelId identifiant du channel où a été envoyé le sondage
     * @param messageId identifiant du message contenant le sondage
     * @returns identifiant du sondage créé
     */
    static async create(title: string, propositions: string[], emojis: string[], dateEnd: Date, memberId: string, channelId: string, messageId: string): Promise<number> {
        const poll = await PollModel.create({
            title: title,
            propositions: propositions,
            emojis: emojis,
            dateEnd: dateEnd,
            createdBy: memberId,
            channelId: channelId,
            messageId: messageId
        })

        await reactions.add(
            ReactionType.PollVote,
            { pollId: poll.id },
            { memberId: memberId, channelId: channelId },
            messageId
        )

        return poll.id
    }

    /**
     * Ajout d'un vote sur un sondage
     * @param reaction The reaction object
     * @param user The user that applied the guild or reaction emoji
     * @param r données concernant la réaction
     */
    static async vote(reaction: MessageReaction, user: User, r: ReactionModel<PollReactionData>) {
        const pollId = r.data.pollId
        const emoji = reaction.emoji.id ? `<${reaction.emoji.animated ? 'a' : ''}:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name

        const poll = await PollModel.findOne({
            where: {
                id: pollId
            }
        })

        if(poll) {
            if(poll.emojis.find(e => e === emoji)) {
                const votes = await PollVoteModel.findAll({
                    where: {
                        pollId: pollId
                    }
                })

                if(!votes.find(v => v.memberId === user.id)) {
                    const vote = await PollVoteModel.create({
                        pollId: pollId,
                        memberId: user.id,
                        vote: <string>emoji
                    })

                    votes.push(vote)

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setTitle(`🗳️ ${poll.title}`)
                        .setDescription(poll.propositions.map((p, i) => {
                            const nbVotes = votes.filter(v => v.vote === poll.emojis[i]).length
                            const percent = Math.round(nbVotes * 100 / votes.length)
                            return `${poll.emojis[i]} : ${p} (${percent}% - ${nbVotes} ${nbVotes > 1 ? 'votes' : 'vote'})`
                        }).join('\n') + `\n\nFin ${time(poll.dateEnd, TimestampStyles.RelativeTime)}`)

                    await reaction.message.edit({ embeds: [embed] })
                }
            }
        }

        await reaction.users.remove(user)
    }

    /**
     * Supprime les réactions pour les sondages terminés
     * @param client client Discord
     */
    static async finish(client: Client) {
        const guild = <Guild>client.guilds.cache.get(config.guild.id)

        const polls = await PollModel.findAll({
            where: {
                dateEnd: {
                    [Op.lte]: new Date()
                }
            }
        })

        for(const poll of polls) {
            const member = <GuildMember>guild.members.cache.get(poll.createdBy)

            const votes = await PollVoteModel.findAll({
                where: { pollId: poll.id }
            })

            await this.delete(poll.id)

            const pollChannel = <TextChannel>guild.channels.cache.get(poll.channelId)
            if(pollChannel) {
                try {
                    const pollMessage = await pollChannel.messages.fetch(poll.messageId)
                    await pollMessage.reactions.removeAll()
                } catch(error) {
                    Logger.log('Poll', 'ERROR', 'Impossible de supprimer les réactions sur le message du sondage')
                }
            }

            const logsChannel = <TextChannel>guild.channels.cache.get(config.guild.channels['logs'])

            const embed = new Embed()
                .setColor('#F1C40F')
                .setTitle(`🗳️ ${poll.title}`)
                .setDescription(poll.propositions.map((p, i) => {
                    const nbVotes = votes.filter(v => v.vote === poll.emojis[i]).length
                    const percent = votes.length > 0 ? Math.round(nbVotes * 100 / votes.length) : 0
                    return `${poll.emojis[i]} : ${p} (${percent}% - ${nbVotes} ${nbVotes > 1 ? 'votes' : 'vote'})`
                }).join('\n'))

            await logsChannel.send({ content: `Le sondage créé par ${userMention(member.id)} vient de se terminer avec ${bold(`${votes.length} ${votes.length > 1 ? 'votes' : 'vote'}`)} :`, embeds: [embed], allowedMentions: { repliedUser: false } })

            Logger.log('Poll', 'INFO', `Le sondage créé par ${member.user.username}#${member.user.discriminator} vient de se terminer avec ${votes.length} ${votes.length > 1 ? 'votes' : 'vote'}`)
        }
    }

    /**
     * Supprime un sondage de la base de données
     * @param pollId identifiant du sondage
     */
    static async delete(pollId: number) {
        await ReactionModel.destroy({ where: { 'data.pollId': pollId } })
        await PollVoteModel.destroy({ where: { pollId: pollId } })
        await PollModel.destroy({ where: { id: pollId } })
    }
}