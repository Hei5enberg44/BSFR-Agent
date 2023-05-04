import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import birthdayMessage from '../controllers/birthdayMessage.js'
import maliciousURL from '../controllers/maliciousURL.js'
import Locales from '../utils/locales.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('list')
        .setNameLocalization('fr', 'lister')
        .setDescription('Misc lists')
        .setDescriptionLocalization('fr', 'Listes diverses')
        .addStringOption(option =>
            option.setName('subject')
                .setNameLocalization('fr', 'sujet')
                .setDescription('Subject')
                .setDescriptionLocalization('fr', 'Sujet')
                .setChoices(
                    { name: 'Birthday message', name_localizations: { fr: 'Message d\'anniversaire' }, value: 'birthday_message' },
                    { name: 'Malicious URL', name_localizations: { fr: 'URL malveillant' }, value: 'malicious_url' }
                )
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page to display')
                .setDescriptionLocalization('fr', 'Page à afficher')
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['bot-setup']
    ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {string} */
            const subject = interaction.options.getString('subject')
            /** @type {number} */
            const page = interaction.options.getInteger('page') ?? 1

            if(page < 1) throw new CommandInteractionError(Locales.get(interaction.locale, 'page_error'))

            const embed = new Embed().setColor('#F1C40F')

            try {
                switch(subject) {
                    case 'birthday_message': {
                        const messageList = await birthdayMessage.list(page)
                        embed.setTitle(Locales.get(interaction.locale, 'list_birthday_messages'))
                        embed.setDescription(messageList.items.map(message => `${message.id} - ${message.message}`).join('\n'))
                        embed.addFields({ name: 'Page', value: Locales.get(interaction.locale, 'page_info', messageList.page, messageList.pageCount) })
                        break
                    }
                    case 'malicious_url': {
                        const urlList = await maliciousURL.list(page)
                        embed.setTitle(Locales.get(interaction.locale, 'list_malicious_urls'))
                        embed.setDescription(urlList.items.map(url => `${url.id} - ${url.url}`).join('\n'))
                        embed.addFields({ name: 'Page', value: Locales.get(interaction.locale, 'page_info', urlList.page, urlList.pageCount) })
                        break
                    }
                }
            } catch(error) {
                if(error.name === 'PAGE_NOT_FOUND_ERROR') {
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'page_not_found'))
                } else if(error.name === 'BIRTHDAY_MESSAGE_EMPTY_ERROR') {
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'empty_birthday_messages'))
                } else if(error.name === 'MALICIOUS_URL_EMPTY_ERROR') {
                    throw new CommandInteractionError(Locales.get(interaction.locale, 'empty_malicious_urls'))
                }
            }

            await interaction.reply({ embeds: [embed], ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}