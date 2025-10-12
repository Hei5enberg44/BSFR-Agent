import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    GuildChannel,
    TextChannel,
    time,
    TimestampStyles,
    userMention,
    hyperlink,
    EmbedBuilder
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import poll from '../controllers/poll.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setNameLocalization('fr', 'sondage')
        .setDescription('Create a poll')
        .setDescriptionLocalization('fr', 'Créer un sondage')
        .addStringOption((option) =>
            option
                .setName('title')
                .setNameLocalization('fr', 'titre')
                .setDescription('Poll title')
                .setDescriptionLocalization('fr', 'Titre du sondage')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('list')
                .setNameLocalization('fr', 'liste')
                .setDescription(
                    'List of proposals separated by a semicolon (max. 8)'
                )
                .setDescriptionLocalization(
                    'fr',
                    'Liste des propositions séparées par un point virgule (max. 8)'
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('end_date')
                .setNameLocalization('fr', 'date_fin')
                .setDescription(
                    'Poll end date in DD/MM/YYYY HH:II format (ex: 04/05/2023 15:30)'
                )
                .setDescriptionLocalization(
                    'fr',
                    'Date de fin du sondage au format JJ/MM/AAAA HH:II (ex: 04/05/2023 15:30)'
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('emojis')
                .setDescription(
                    'Custom emojis separated by a semicolon (must match the number of proposals)'
                )
                .setDescriptionLocalization(
                    'fr',
                    'Emojis personnalisés séparés par un point virgule (doit correspondre au nombre de propositions)'
                )
                .setRequired(false)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const title = interaction.options.getString('title', true)
            const list = interaction.options.getString('list', true)
            const date = interaction.options.getString('end_date', true)
            const emojiList = interaction.options.getString('emojis')

            const propositions = list.split(';')
            if (propositions.length > 8)
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'poll_poposals_count_error')
                )

            const defaultEmojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭']
            const emojis = emojiList
                ? emojiList.split(';').map((e) => e.trim())
                : defaultEmojis.slice(0, propositions.length)
            if (emojis.length !== propositions.length)
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'poll_emojis_count_error')
                )

            if (
                !date.match(
                    /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}\s([0-1][0-9]|2[0-3]):[0-5][0-9]$/
                )
            )
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'invalid_datetime')
                )

            const dateDate = date.split(' ')[0]
            const dateTime = date.split(' ')[1]

            const dateEnd = new Date(
                parseInt(dateDate.split('/')[2]),
                parseInt(dateDate.split('/')[1]) - 1,
                parseInt(dateDate.split('/')[0]),
                parseInt(dateTime.split(':')[0]),
                parseInt(dateTime.split(':')[1])
            )

            if (dateEnd <= new Date())
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'poll_date_error')
                )

            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle(`🗳️ ${title}`)
                .setDescription(
                    propositions
                        .map((p, i) => {
                            return `${emojis[i]} : ${p} (0% - 0 vote)`
                        })
                        .join('\n') +
                        `\n\nFin ${time(dateEnd, TimestampStyles.RelativeTime)}`
                )

            const message = await interaction.reply({
                embeds: [embed],
                fetchReply: true
            })

            const pollId = await poll.create(
                title,
                propositions,
                emojis,
                dateEnd,
                interaction.user.id,
                (interaction.channel as GuildChannel).id,
                message.id
            )

            try {
                for (const emoji of emojis) {
                    await message.react(emoji)
                }
            } catch (error) {
                await message.reactions.removeAll()
                await poll.delete(pollId)

                if (error.message === 'Unknown Emoji')
                    throw new CommandInteractionError(
                        Locales.get(
                            interaction.locale,
                            'poll_unknown_emoji_error'
                        )
                    )
                else throw new CommandInteractionError(error.message)
            }

            const guild = message.guild as Guild
            const logsChannel = guild.channels.cache.get(
                config.guild.channels['logs']
            ) as TextChannel

            const logEmbed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('🗳️ Nouveau sondage !')
                .setDescription(
                    `${userMention(interaction.user.id)} a créé un sondage – ${hyperlink('Voir', message.url)}`
                )

            await logsChannel.send({ embeds: [logEmbed] })

            Logger.log(
                'Poll',
                'INFO',
                `${interaction.user.username}#${interaction.user.discriminator} a créé un sondage`
            )
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
