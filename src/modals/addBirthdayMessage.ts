import {
    EmbedBuilder,
    GuildMember,
    ModalSubmitInteraction,
    userMention
} from 'discord.js'
import { ModalError } from '../utils/error.js'
import birthdayMessage from '../controllers/birthdayMessage.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const text =
                interaction.fields.getTextInputValue('birthday_message')

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle(
                    Locales.get(interaction.locale, 'added_birthday_message')
                )
                .setThumbnail(
                    interaction.user.displayAvatarURL({ forceStatic: false })
                )
                .addFields({
                    name: Locales.get(interaction.locale, 'member'),
                    value: userMention(interaction.user.id)
                })
                .addFields({
                    name: Locales.get(interaction.locale, 'birthday_message'),
                    value: text.trim()
                })

            await birthdayMessage.add(text, interaction.member as GuildMember)

            Logger.log(
                'BirthdayMessage',
                'INFO',
                `${interaction.user.username} a ajouté le message d'anniversaire suivant : ${text.trim()}`
            )

            await interaction.reply({ embeds: [embed] })
        } catch (error) {
            if (error.name === 'MODAL_SUBMISSION_ERROR') {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}
