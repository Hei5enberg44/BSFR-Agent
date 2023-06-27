import { ReactionModel, ReactionDataType, BirthdayMessageReactionData, MaliciousURLReactionData, PollReactionData, BanReactionData, ReactionInteraction } from './database.js'
import { Op } from 'sequelize'

export enum ReactionType {
    RemoveBirthdayMessage = 'removeBirthdayMessage',
    RemoveMaliciousURL = 'removeMaliciousURL',
    BanRequest = 'banRequest',
    PollVote = 'pollVote'
}

export default class Reactions {
    static async add(type: ReactionType, data: ReactionDataType, interaction: Partial<ReactionInteraction>, messageId: string) {
        await ReactionModel.create({
            type: type,
            data: data,
            interaction: interaction,
            messageId: messageId
        })
    }

    static async get(channelId: string, messageId: string) {
        const reaction = await ReactionModel.findOne({
            where: {
                [Op.and]: [
                    { 'interaction.channelId': channelId },
                    { messageId: messageId }
                ]
            }
        })
        if(!reaction) return null
        return new BaseReaction(reaction)
    }
}

export class BaseReaction {
    private reaction
    public id
    public data
    public interaction
    public messageId
    public date

    constructor(reaction: ReactionModel<ReactionDataType>) {
        this.reaction = reaction
        this.id = reaction.id
        this.data = reaction.data
        this.interaction = reaction.interaction
        this.messageId = reaction.messageId
        this.date = reaction.date
    }

    isRemoveBirthdayMessage(): this is ReactionModel<BirthdayMessageReactionData[]> {
        return this.reaction.type === ReactionType.RemoveBirthdayMessage
    }

    isRemoveMaliciousURL(): this is ReactionModel<MaliciousURLReactionData[]> {
        return this.reaction.type === ReactionType.RemoveMaliciousURL
    }

    isBanRequest(): this is ReactionModel<BanReactionData> {
        return this.reaction.type === ReactionType.BanRequest
    }

    isPollVote(): this is ReactionModel<PollReactionData> {
        return this.reaction.type === ReactionType.PollVote
    }
}