const { CommandInteraction, MessageActionRow, MessageButton } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const city = require('../controllers/city')
const Logger = require('../utils/logger')

module.exports = {
	data: {
		name: 'city',
		description: 'Ajoute/Supprime une ville d\'origine',
        options: [
            {
                type: 'SUB_COMMAND',
                name: 'set',
                description: 'Ajoute une ville d\'origine',
                options: [
                    {
                        type: 'INTEGER',
                        name: 'code_postal',
                        description: 'Code postal',
                        required: true
                    }
                ]
            },
            {
                type: 'SUB_COMMAND',
                name: 'unset',
                description: 'Supprime une ville d\'origine'
            }
        ],
        default_member_permissions: '0'
    },

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const action = interaction.options.getSubcommand()

            switch(action) {
                case 'set':
                    const postalCode = interaction.options.getInteger('code_postal')

                    const cities = await city.getCitiesByPostalCode(postalCode)

                    if(cities.length > 0) {
                        const citiesButtons = new MessageActionRow()

                        for(const c of cities) {
                            citiesButtons.addComponents(
                                new MessageButton()
                                    .setCustomId(`${c.code_postal},${c.nom_de_la_commune}`)
                                    .setLabel(c.nom_de_la_commune)
                                    .setStyle('PRIMARY')
                            )
                        }

                        await interaction.reply({ content: 'Veuillez sélectionner votre ville :', components: [citiesButtons], ephemeral: true })

                        const filter = i => i.user.id === interaction.user.id

                        const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 15000 })

                        collector.on('end', async (collected, reason) => {
                            if(reason === 'time') {
                                await interaction.editReply({ content: 'Vous avez mis trop de temps à répondre', components: [] })
                            } else {
                                const c = collected.first().customId.split(',')

                                await city.set(interaction.user.id, c[0], c[1])

                                await interaction.editReply({ content: 'Votre ville d\'origine a bien été enregistrée', components: [] })

                                Logger.log('CityCommand', 'INFO', `${interaction.user.tag} a ajouté sa ville d'origine`)
                            }
                        })
                    } else {
                        await interaction.reply({ content: `Aucune ville correspondant au code postal ${postalCode} n'a été trouvée`, ephemeral: true })
                    }
                    break
                case 'unset':
                    await city.unset(interaction.user.id)

                    Logger.log('CityCommand', 'INFO', `${interaction.user.tag} a supprimé sa ville d'origine`)

                    await interaction.reply({ content: 'Votre ville d\'origine a bien été supprimée', ephemeral: true })
                    break
            }
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}