import { MessageReaction, User } from 'discord.js'
import reactions from '../controllers/reactions.js'
import birthdayMessage from '../controllers/birthdayMessage.js'
import maliciousURL from '../controllers/maliciousURL.js'
import poll from '../controllers/poll.js'

export default class messageReactionAdd {
    private static reaction: MessageReaction
    private static user: User

    /**
     * Emitted whenever a reaction is added to a cached message
     * @param reaction The reaction object
     * @param user The user that applied the guild or reaction emoji
     */
    static async execute(reaction: MessageReaction, user: User) {
        this.reaction = reaction
        this.user = user

        if (reaction.partial) await reaction.fetch()

        const r = await reactions.get(
            reaction.message.channelId,
            reaction.message.id
        )

        if (r && !user.bot) {
            if (r.isRemoveBirthdayMessage())
                await birthdayMessage.confirmRemove(reaction, user, r)
            if (r.isRemoveMaliciousURL())
                await maliciousURL.confirmRemove(reaction, user, r)
            if (r.isPollVote()) await poll.vote(reaction, user, r)
        }
    }
}
