import { MessageReaction, User } from 'discord.js'
import { Reactions } from '../controllers/database.js'
import { Op } from 'sequelize'
import rules from '../controllers/rules.js'

export default {
    /**
     * Emitted whenever a reaction is removed from a cached message
     * @param {MessageReaction} reaction The reaction object
     * @param {User} user The user whose emoji or reaction emoji was removed
     */
    async execute(reaction, user) {
        if(reaction.partial)
            await reaction.fetch()

        const r = await Reactions.findOne({
            where: {
                [Op.and]: [
                    { 'interaction.channelId': reaction.message.channelId },
                    { messageId: reaction.message.id }
                ]
            }
        })

        if(r && !user.bot) {
            const type = r.type

            switch(type) {
                // Retrait de rôle après refus des règles
                case 'rules':
                    await rules.refuse(reaction, user)
                    break
            }
        }
    }
}