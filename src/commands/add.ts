import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from 'discord.js'
import { CommandError } from '../utils/error.js'
import Locales from '../utils/locales.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('add')
        .setNameLocalization('fr', 'ajouter')
        .setDescription('Misc additions')
        .setDescriptionLocalization('fr', 'Ajouts divers')
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
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['bot-setup']
    ],

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const subject = interaction.options.getString('subject', true)

            switch(subject) {
                case 'birthday_message': {
                    const modal = new ModalBuilder()
                        .setCustomId('addBirthdayMessage')
                        .setTitle(Locales.get(interaction.locale, 'add_birthday_message'))

                    const birthdayMessageInput = new TextInputBuilder()
                        .setCustomId('birthday_message')
                        .setLabel('Message')
                        .setPlaceholder('Bon anniversaire !p 🥳')
                        .setMinLength(1)
                        .setMaxLength(1500)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)

                    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(birthdayMessageInput)
                    modal.addComponents(actionRow)

                    await interaction.showModal(modal)

                    break
                }
                case 'malicious_url': {
                    const modal = new ModalBuilder()
                        .setCustomId('addMaliciousURL')
                        .setTitle(Locales.get(interaction.locale, 'add_malicious_url'))

                    const maliciousURLInput = new TextInputBuilder()
                        .setCustomId('malicious_url')
                        .setLabel('URL')
                        .setPlaceholder('dicsrod.com')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)

                    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(maliciousURLInput)
                    modal.addComponents(actionRow)

                    await interaction.showModal(modal)

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