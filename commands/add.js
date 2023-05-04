import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError } from '../utils/error.js'
import birthdayMessage from '../controllers/birthdayMessage.js'
import maliciousURL from '../controllers/maliciousURL.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'
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
        .addStringOption(option =>
            option.setName('text')
                .setNameLocalization('fr', 'texte')
                .setDescription('Bithday message or malicious URL')
                .setDescriptionLocalization('fr', 'Message d\'anniversaire ou URL malveillant')
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
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {string} */
            const subject = interaction.options.getString('subject')
            /** @type {string} */
            const text = interaction.options.getString('text')

            const embed = new Embed()
                .setColor('#2ECC71')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields({ name: Locales.get(interaction.locale, 'member'), value: userMention(interaction.user.id) })

            switch(subject) {
                case 'birthday_message': {
                    await birthdayMessage.add(text, interaction.user)

                    Logger.log('BirthdayMessage', 'INFO', `${interaction.user.tag} a ajouté le message d'anniversaire suivant : ${text.trim()}`)

                    embed.setTitle(Locales.get(interaction.locale, 'added_birthday_message'))
                    embed.addFields({ name: Locales.get(interaction.locale, 'birthday_message'), value: text.trim() })

                    break
                }
                case 'malicious_url': {
                    await maliciousURL.add(text, interaction.user)

                    Logger.log('MaliciousURL', 'INFO', `${interaction.user.tag} a ajouté l'URL malveillant suivant : ${text.trim()}`)

                    embed.setTitle(Locales.get(interaction.locale, 'added_malicious_url'))
                    embed.addFields({ name: Locales.get(interaction.locale, 'malicious_url'), value: text.trim() })

                    break
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