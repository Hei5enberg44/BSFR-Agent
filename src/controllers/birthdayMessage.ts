import { GuildMember, MessageReaction, CommandInteraction, User, TextChannel, userMention, LocaleString } from 'discord.js'
import Embed from '../utils/embed.js'
import { BirthdayMessageModel, ReactionModel, BirthdayMessageReactionData } from './database.js'
import reactions, { ReactionType } from './reactions.js'
import { PageNotFoundError, BirthdayMessageEmptyError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

interface BirthdayMessageItemsPage {
    items: BirthdayMessageModel[],
    page: number,
    pageCount: number
}

export default {
    /**
     * Ajoute un message d'anniversaire dans la base de données
     * @param message message d'anniversaire
     * @param member membre réalisant la demande d'ajout
     */
    async add(message: string, member: GuildMember) {
        await BirthdayMessageModel.create({
            message: message.trim(),
            memberId: member.id
        })
    },

    /**
     * Récupère une liste de messages d'anniversaire par rapport à un ou plusieurs ids
     * @param ids identifiant(s) des messages d'anniversaire à récupérer
     * @returns liste des messages d'anniversaire
     */
    async get(ids: string) {
        const idList = ids.split(';').map(id => id.trim())
        const messagesList = await BirthdayMessageModel.findAll({
            where: {
                id: idList
            }
        })
        return messagesList
    },

    /**
     * Retourne la liste des messages d'anniversaire depuis la base de données
     * @param page page à retourner
     * @returns liste des messages d'anniversaire
     */
    async list(page: number): Promise<BirthdayMessageItemsPage> {
        const itemsPerPage = 10

        const messagesCount = await BirthdayMessageModel.count()

        if(messagesCount == 0)
            throw new BirthdayMessageEmptyError()
        
        const pageCount = Math.ceil(messagesCount / itemsPerPage)

        if(page > pageCount)
            throw new PageNotFoundError()

        const messages = await BirthdayMessageModel.findAll({
            order: [
                [ 'id', 'ASC' ]
            ],
            offset: (page - 1) * itemsPerPage,
            limit: itemsPerPage
        })

        return {
            items: messages,
            page,
            pageCount
        }
    },

    /**
     * Ajout d'une requête de suppression de messages d'anniversaire dans la base de données
     * @param messagesList liste des messages d'anniversaire à supprimer
     * @param interaction interaction Discord
     * @param messageId identifiant du message de confirmation de suppression
     */
    async remove(messagesList: BirthdayMessageModel[], interaction: CommandInteraction, messageId: string) {
        await reactions.add(
            ReactionType.RemoveBirthdayMessage,
            messagesList,
            {
                locale: interaction.locale,
                commandName: interaction.commandName,
                memberId: interaction.user.id,
                channelId: (<TextChannel>interaction.channel).id
            },
            messageId
        )
    },

    /**
     * Supression de messages d'anniversaire
     * @param reaction The reaction object
     * @param user The user that applied the guild or reaction emoji
     * @param r données concernant la réaction
     */
    async confirmRemove(reaction: MessageReaction, user: User, r: ReactionModel<BirthdayMessageReactionData[]>) {
        if(r.interaction.memberId === user.id) {
            const embed = new Embed()
                .setThumbnail(user.displayAvatarURL({ forceStatic: false }))
                .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'member'), value: userMention(user.id) })

            const ids = r.data.map(message => message.id)
            const messages = r.data.map(message => message.message)

            if(reaction.emoji.name === '✅') {
                await BirthdayMessageModel.destroy({ where: { id: ids } })
                await ReactionModel.destroy({ where: { id: r.id } })

                Logger.log('BirthdayMessage', 'INFO', `${user.username} a supprimé les messages d'anniversaire suivants : ${messages.join(', ')}`)

                embed.setColor('#2ECC71')
                    .setTitle(Locales.get(<LocaleString>r.interaction.locale, 'delete_birthday_messages'))
                    .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'deleted_birthday_messages'), value: messages.join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            } else if(reaction.emoji.name === '❌') {
                await ReactionModel.destroy({ where: { id: r.id } })

                embed.setColor('#E74C3C')
                    .setTitle(Locales.get(<LocaleString>r.interaction.locale, 'delete_birthday_messages_refusal'))
                    .addFields({ name: Locales.get(<LocaleString>r.interaction.locale, 'undeleted_birthday_messages'), value: messages.join('\n') })

                await reaction.message.reactions.removeAll()
                await reaction.message.edit({ embeds: [embed] })
            }
        } else {
            await reaction.users.remove(user)
        }
    }
}