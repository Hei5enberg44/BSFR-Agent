import {
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    AttachmentBuilder,
    ChatInputCommandInteraction
} from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Shows bot logs')
        .setDescriptionLocalization('fr', 'Affiche les logs du bot')
        .addStringOption((option) =>
            option
                .setName('date')
                .setDescription('Display logs for a given date (DD/MM/YYYY)')
                .setDescriptionLocalization(
                    'fr',
                    'Afficher les logs pour une date donnée (JJ/MM/AAAA)'
                )
                .setRequired(false)
        )
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    allowedChannels: [config.guild.channels['logs']],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            let date =
                interaction.options.getString('date') ??
                new Date().toLocaleDateString('fr-FR', {
                    timeZone: 'Europe/Paris'
                })

            if (
                !date.match(
                    /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/
                )
            )
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'invalid_date')
                )

            const splitedDate = date.split('/')
            date = `${splitedDate[2]}-${splitedDate[1]}-${splitedDate[0]}`

            const log = Logger.get(date)

            if (!log)
                throw new CommandInteractionError(
                    Locales.get(interaction.locale, 'no_log_found')
                )

            const attachment = new AttachmentBuilder(log, {
                name: `${date}.log`
            })

            await interaction.reply({ files: [attachment] })
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
