import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CollectorFilter,
    ComponentType,
    ButtonInteraction,
    TextChannel
} from 'discord.js'
import { CommandError } from '../utils/error.js'
import city from '../controllers/city.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    data: new SlashCommandBuilder()
        .setName('city')
        .setNameLocalization('fr', 'ville')
        .setDescription('Adds/Removes the city where you live')
        .setDescriptionLocalization(
            'fr',
            'Ajoute/Supprime ta ville de résidence'
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('add')
                .setNameLocalization('fr', 'ajouter')
                .setDescription('Add the city where you live')
                .setDescriptionLocalization(
                    'fr',
                    'Ajouter ta ville de résidence'
                )
                .addStringOption((option) =>
                    option
                        .setName('city_name')
                        .setNameLocalization('fr', 'nom_ville')
                        .setDescription('Name of your city')
                        .setDescriptionLocalization('fr', 'Nom de ta ville')
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('remove')
                .setNameLocalization('fr', 'supprimer')
                .setDescription('Remove the city where you live')
                .setDescriptionLocalization(
                    'fr',
                    'Supprimer ta ville de résidence'
                )
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const action = interaction.options.getSubcommand()

            switch (action) {
                case 'add': {
                    const cityName = interaction.options.getString(
                        'city_name',
                        true
                    )

                    const cities = await city.getCitiesByName(cityName)

                    if (cities.length > 0) {
                        const customId = new Date().getTime().toString()
                        const maxRows = 4
                        const maxItemsPerRow = 5
                        const pageCount = Math.ceil(
                            cities.length / (maxRows * maxItemsPerRow)
                        )
                        let page = 0

                        const getComponents = (
                            page: number = 0
                        ): ActionRowBuilder<ButtonBuilder>[] => {
                            const components = []

                            const _cities = cities.slice(
                                page * maxRows * maxItemsPerRow,
                                page * maxRows * maxItemsPerRow +
                                    maxRows * maxItemsPerRow
                            )
                            for (
                                let row = 0;
                                row < Math.ceil(_cities.length / 5);
                                row++
                            ) {
                                const citiesButtons =
                                    new ActionRowBuilder<ButtonBuilder>()
                                const citiesRow = _cities.slice(
                                    row * maxItemsPerRow,
                                    row * maxItemsPerRow + maxItemsPerRow
                                )

                                for (const c of citiesRow) {
                                    citiesButtons.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId(
                                                `${c.country}_${c.name}_${c.coordinates.lat}_${c.coordinates.lon}_${customId}`
                                            )
                                            .setLabel(
                                                `${c.name} (${c.country})`
                                            )
                                            .setStyle(ButtonStyle.Secondary)
                                    )
                                }
                                components.push(citiesButtons)
                            }

                            const citiesButtons =
                                new ActionRowBuilder<ButtonBuilder>()
                            citiesButtons.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`previous_${customId}`)
                                    .setLabel(
                                        Locales.get(
                                            interaction.locale,
                                            'previous'
                                        )
                                    )
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(page > 0 ? false : true),
                                new ButtonBuilder()
                                    .setCustomId(`next_${customId}`)
                                    .setLabel(
                                        Locales.get(interaction.locale, 'next')
                                    )
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(
                                        page < pageCount - 1 ? false : true
                                    )
                            )
                            components.push(citiesButtons)

                            return components
                        }

                        let components = getComponents()

                        await interaction.reply({
                            content: Locales.get(
                                interaction.locale,
                                'select_your_city'
                            ),
                            components: components,
                            ephemeral: true
                        })

                        const filter: CollectorFilter<[ButtonInteraction]> = (
                            i
                        ) =>
                            i.customId.includes(customId) &&
                            i.user.id === interaction.user.id

                        const collector = (
                            interaction.channel as TextChannel
                        ).createMessageComponentCollector<ComponentType.Button>(
                            { filter, time: 60_000 }
                        )

                        collector.on('collect', async (i) => {
                            const choice = i.customId

                            if (
                                ![
                                    `previous_${customId}`,
                                    `next_${customId}`
                                ].find((x) => x === choice)
                            ) {
                                await i.deferUpdate()

                                const [
                                    countryName,
                                    cityName,
                                    latitude,
                                    longitude
                                ] = choice.split('_')
                                await city.set(
                                    interaction.user.id,
                                    countryName,
                                    cityName,
                                    latitude,
                                    longitude
                                )

                                await i.editReply({
                                    content: Locales.get(
                                        interaction.locale,
                                        'city_added'
                                    ),
                                    components: []
                                })

                                Logger.log(
                                    'CityCommand',
                                    'INFO',
                                    `${interaction.user.username} a ajouté sa ville d'origine`
                                )
                            } else {
                                collector.resetTimer()
                                await i.deferUpdate()

                                page =
                                    choice === `previous_${customId}`
                                        ? page - 1
                                        : page + 1
                                components = getComponents(page)

                                await i.editReply({
                                    content: Locales.get(
                                        interaction.locale,
                                        'select_your_city'
                                    ),
                                    components: components
                                })
                            }
                        })

                        collector.on('end', async (collected, reason) => {
                            if (reason === 'time') {
                                await interaction.editReply({
                                    content: Locales.get(
                                        interaction.locale,
                                        'too_long_to_respond_error'
                                    ),
                                    components: []
                                })
                            }
                        })
                    } else {
                        await interaction.reply({
                            content: Locales.get(
                                interaction.locale,
                                'city_not_found_error',
                                cityName
                            ),
                            ephemeral: true
                        })
                    }
                    break
                }
                case 'remove': {
                    await city.unset(interaction.user.id)

                    Logger.log(
                        'CityCommand',
                        'INFO',
                        `${interaction.user.username} a supprimé sa ville d'origine`
                    )

                    await interaction.reply({
                        content: Locales.get(
                            interaction.locale,
                            'city_removed'
                        ),
                        ephemeral: true
                    })
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
