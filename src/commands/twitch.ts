import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import twitch from '../controllers/twitch.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('twitch')
        .setDescription('Links your Twitch account to enable notifications when you\'re live')
        .setDescriptionLocalization('fr', 'Lie votre compte Twitch afin d\'activer les notifications lorsque vous êtes en live')
        .addSubcommand(subcommand =>
            subcommand.setName('link')
                .setNameLocalization('fr', 'lier')
                .setDescription('Link your Twitch channel')
                .setDescriptionLocalization('fr', 'Lier votre chaîne Twitch')
                .addStringOption(option =>
                    option.setName('channel')
                        .setNameLocalization('fr', 'chaine')
                        .setDescription('Name of your Twitch channel')
                        .setDescriptionLocalization('fr', 'Nom de votre chaîne Twitch')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('unlink')
                .setNameLocalization('fr', 'délier')
                .setDescription('Unlink your Twitch channel')
                .setDescriptionLocalization('fr', 'Délier votre chaîne Twitch')
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    ,
    allowedChannels: [
        config.guild.channels['twitch-youtube']
    ],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const action = interaction.options.getSubcommand(true)

            switch(action) {
                case 'link': {
                    const channelName = interaction.options.getString('channel', true)

                    if(channelName.match(/^https?:\/\//)) throw new CommandInteractionError(Locales.get(interaction.locale, 'twitch_channel_error'))

                    await twitch.link(interaction.user.id, channelName)

                    Logger.log('TwitchCommand', 'INFO', `${interaction.user.username} a lié son compte Twitch`)

                    await interaction.reply({ content: Locales.get(interaction.locale, 'twitch_channel_linked'), ephemeral: true })
                    break
                }
                case 'unlink': {
                    await twitch.unlink(interaction.user.id)

                    Logger.log('TwitchCommand', 'INFO', `${interaction.user.username} a délié son compte Twitch`)

                    await interaction.reply({ content: Locales.get(interaction.locale, 'twitch_channel_unlinked'), ephemeral: true })
                    break
                }
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}