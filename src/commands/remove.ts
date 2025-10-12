import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    Message,
    userMention,
    EmbedBuilder
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import birthdayMessage from '../controllers/birthdayMessage.js'
import maliciousURL from '../controllers/maliciousURL.js'
import Locales from '../utils/locales.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setNameLocalization('fr', 'supprimer')
        .setDescription('Misc deletions')
        .setDescriptionLocalization('fr', 'Suppressions diverses')
        .addStringOption((option) =>
            option
                .setName('subject')
                .setNameLocalization('fr', 'sujet')
                .setDescription('Subject')
                .setDescriptionLocalization('fr', 'Sujet')
                .setChoices(
                    {
                        name: 'Birthday message',
                        name_localizations: { fr: "Message d'anniversaire" },
                        value: 'birthday_message'
                    },
                    {
                        name: 'Malicious URL',
                        name_localizations: { fr: 'URL malveillant' },
                        value: 'malicious_url'
                    }
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('ids')
                .setDescription(
                    '/!\\ If there are several IDs, please separate them with a semicolon /!\\'
                )
                .setDescriptionLocalization(
                    'fr',
                    '/!\\ Si il y a plusieurs IDs, merci de les séparer par un point virgule /!\\'
                )
                .setRequired(true)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    allowedChannels: [config.guild.channels['bot-setup']],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const subject = interaction.options.getString('subject', true)
            const ids = interaction.options.getString('ids', true)

            const react = async (reply: Message) => {
                await reply.react('✅')
                await reply.react('❌')
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setThumbnail(
                    interaction.user.displayAvatarURL({ forceStatic: false })
                )
                .addFields({
                    name: Locales.get(interaction.locale, 'member'),
                    value: userMention(interaction.user.id)
                })

            switch (subject) {
                case 'birthday_message': {
                    const messagesList = await birthdayMessage.get(ids)

                    if (messagesList.length === 0)
                        throw new CommandInteractionError(
                            Locales.get(
                                interaction.locale,
                                'delete_birthday_messages_error'
                            )
                        )

                    embed.setTitle(
                        Locales.get(
                            interaction.locale,
                            'delete_birthday_messages_confirm'
                        )
                    )
                    embed.setDescription(
                        Locales.get(
                            interaction.locale,
                            'delete_birthday_messages_question'
                        )
                    )
                    embed.addFields({
                        name: Locales.get(
                            interaction.locale,
                            'birthday_messages'
                        ),
                        value: messagesList
                            .map((message) => message.message)
                            .join('\n')
                    })

                    const reply = await interaction.reply({
                        embeds: [embed],
                        fetchReply: true
                    })

                    await birthdayMessage.remove(
                        messagesList,
                        interaction,
                        reply.id
                    )

                    await react(reply)

                    break
                }
                case 'malicious_url': {
                    const urlsList = await maliciousURL.get(ids)

                    if (urlsList.length === 0)
                        throw new CommandInteractionError(
                            Locales.get(
                                interaction.locale,
                                'delete_malicious_urls_error'
                            )
                        )

                    embed.setTitle(
                        Locales.get(
                            interaction.locale,
                            'delete_malicious_urls_confirm'
                        )
                    )
                    embed.setDescription(
                        Locales.get(
                            interaction.locale,
                            'delete_malicious_urls_question'
                        )
                    )
                    embed.addFields({
                        name: Locales.get(interaction.locale, 'malicious_urls'),
                        value: urlsList.map((url) => url.url).join('\n')
                    })

                    const reply = await interaction.reply({
                        embeds: [embed],
                        fetchReply: true
                    })

                    await maliciousURL.remove(urlsList, interaction, reply.id)

                    await react(reply)

                    break
                }
            }
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
