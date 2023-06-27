import { MessageReaction, User } from 'discord.js'
import reactions from '../controllers/reactions.js'

export default class messageReactionRemove {
    private static reaction: MessageReaction
    private static user: User

    /**
     * Emitted whenever a reaction is removed from a cached message
     * @param reaction The reaction object
     * @param user The user whose emoji or reaction emoji was removed
     */
    static async execute(reaction: MessageReaction, user: User) {
        this.reaction = reaction
        this.user = user

        if(reaction.partial)
            await reaction.fetch()

        const r = await reactions.get(reaction.message.channelId, reaction.message.id)

        if(r && !user.bot) {
            
        }
    }
}