import * as fs from 'node:fs'
import { Client, Collection, EmbedBuilder, BaseInteraction } from 'discord.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default class Modals {
    /**
     * @param {Client} client client Discord
     */
    constructor(client) {
        this.client = client
    }

    /**
     * Chargement des modales au démarrage du Bot
     */
    async load() {
        this.client.modals = new Collection()
        const modalFiles = fs.readdirSync('./modals').filter(file => file.endsWith('.js'))

        // On récupère les modales
        for(const file of modalFiles) {
            const { default: modal } = await import(`../modals/${file}`)
            const name = modal.name || file.split('.')[0]
            Logger.log('ModalManager', 'INFO', `Modale "${name}" trouvée`)
            this.client.modals.set(name, modal)
        }
    }

    /**
     * Écoute des soumissions de modales
     */
    async listen() {
        this.client.on('interactionCreate',
            /**
             * @param {BaseInteraction} interaction The interaction which was created
             */
            async (interaction) => {
                if(!interaction.isModalSubmit()) return

                /** @type {{data: object, execute: function}} */
                const modal = this.client.modals.get(interaction.customId)

                if(!modal) return

                try {
                    await modal.execute(interaction)
                } catch(error) {
                    let errMessage
                    if(error.name === 'MODAL_ERROR') {
                        errMessage = error.message
                    } else {
                        errMessage = Locales.get(interaction.locale, 'modal_error')
                        Logger.log('ModalManager', 'ERROR', `La soumission de la modale "${interaction.customId}" a échouée : ${error.message}`)
                    }

                    const embed = new EmbedBuilder()
                            .setColor('#E74C3C')
                            .setDescription(`❌ ${errMessage}`)

                    if(!interaction.deferred && !interaction.replied) {
                        await interaction.reply({ embeds: [embed], ephemeral: true })
                    } else {
                        await interaction.editReply({ embeds: [embed] })
                    }
                }
            }
        )
    }
}