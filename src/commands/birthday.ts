import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import birthday from '../controllers/birthday.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setNameLocalization('fr', 'anniversaire')
        .setDescription('Adds/Removes your birthday date')
        .setDescriptionLocalization(
            'fr',
            "Ajoute/Supprime ta date d'anniversaire"
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('add')
                .setNameLocalization('fr', 'ajouter')
                .setDescription('Add your birthday date')
                .setDescriptionLocalization(
                    'fr',
                    "Ajouter ta date d'anniversaire"
                )
                .addStringOption((option) =>
                    option
                        .setName('date')
                        .setDescription(
                            'Your date of birth in the format DD/MM/YYYY (ex: 11/06/2000)'
                        )
                        .setDescriptionLocalization(
                            'fr',
                            'Ta date de naissance au format JJ/MM/AAAA (ex: 11/06/2000)'
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('remove')
                .setNameLocalization('fr', 'supprimer')
                .setDescription('Remove your birthday date')
                .setDescriptionLocalization(
                    'fr',
                    "Supprimer ta date d'anniversaire"
                )
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    allowedChannels: [config.guild.channels['rôles-auto-assignable']],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const action = interaction.options.getSubcommand()

            switch (action) {
                case 'add': {
                    const date = interaction.options.getString('date', true)

                    if (
                        !date.match(
                            /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/
                        )
                    )
                        throw new CommandInteractionError(
                            Locales.get(interaction.locale, 'invalid_date')
                        )

                    const bdDate = new Date(
                        parseInt(date.split('/')[2]),
                        parseInt(date.split('/')[1]) - 1,
                        parseInt(date.split('/')[0])
                    )

                    if (bdDate > new Date())
                        throw new CommandInteractionError(
                            Locales.get(interaction.locale, 'nice_try')
                        )

                    await birthday.set(interaction.user.id, bdDate)

                    Logger.log(
                        'BirthdayCommand',
                        'INFO',
                        `${interaction.user.username} a enregistré sa date de naissance`
                    )

                    await interaction.reply({
                        content: Locales.get(
                            interaction.locale,
                            'birthday_date_added'
                        ),
                        ephemeral: true
                    })
                    break
                }
                case 'remove': {
                    await birthday.unset(interaction.user.id)

                    Logger.log(
                        'BirthdayCommand',
                        'INFO',
                        `${interaction.user.username} a supprimé sa date de naissance`
                    )

                    await interaction.reply({
                        content: Locales.get(
                            interaction.locale,
                            'birthday_date_removed'
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
