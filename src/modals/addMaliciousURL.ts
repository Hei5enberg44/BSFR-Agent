import { GuildMember, ModalSubmitInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { ModalError } from '../utils/error.js'
import maliciousURL from '../controllers/maliciousURL.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    /**
     * Soumission de la modale
     * @param interaction interaction Discord
     */
    async execute(interaction: ModalSubmitInteraction) {
        try {
            const text = interaction.fields.getTextInputValue('malicious_url')

            const embed = new Embed()
                .setColor('#2ECC71')
                .setTitle(Locales.get(interaction.locale, 'added_malicious_url'))
                .setThumbnail(interaction.user.displayAvatarURL({ forceStatic: false }))
                .addFields({ name: Locales.get(interaction.locale, 'member'), value: userMention(interaction.user.id) })
                .addFields({ name: Locales.get(interaction.locale, 'malicious_url'), value: text.trim() })

            await maliciousURL.add(text, <GuildMember>interaction.member)

            Logger.log('MaliciousURL', 'INFO', `${interaction.user.username} a ajouté l'URL malveillant suivant : ${text.trim()}`)

            await interaction.reply({ embeds: [embed] })
        } catch(error) {
            if(error.name === 'MODAL_SUBMISSION_ERROR') {
                throw new ModalError(error.message, interaction.customId)
            } else {
                throw Error(error.message)
            }
        }
    }
}