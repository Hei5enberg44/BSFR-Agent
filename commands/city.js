const { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const city = require('../controllers/city')
const Logger = require('../utils/logger')

module.exports = {
	data: {
		name: 'city',
		description: 'Ajoute/Supprime une ville d\'origine',
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'set',
                description: 'Ajoute une ville d\'origine',
                options: [
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'code_postal',
                        description: 'Code postal',
                        required: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
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
                        const customId = (new Date()).getTime()
                        const maxRows = 4
                        const maxItemsPerRow = 5
                        const pageCount = Math.ceil(cities.length / (maxRows * maxItemsPerRow))
                        let page = 0

                        const getComponents = function(page = 0) {
                            let components = []

                            const _cities = cities.slice(page * maxRows * maxItemsPerRow, (page * maxRows * maxItemsPerRow) + (maxRows * maxItemsPerRow))
                            for(let row = 0; row < Math.ceil(_cities.length / 5); row++) {
                                const citiesButtons = new ActionRowBuilder()
                                const citiesRow = _cities.slice(row * maxItemsPerRow, (row * maxItemsPerRow) + maxItemsPerRow)
    
                                for(const c of citiesRow) {
                                    citiesButtons.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId(`${c.code_postal}_${c.nom_de_la_commune}_${customId}`)
                                            .setLabel(c.nom_de_la_commune)
                                            .setStyle(ButtonStyle.Secondary)
                                    )
                                }
                                components.push(citiesButtons)
                            }

                            const citiesButtons = new ActionRowBuilder()
                            citiesButtons.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`previous_${customId}`)
                                    .setLabel('Précédent')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(page > 0 ? false : true),
                                new ButtonBuilder()
                                    .setCustomId(`next_${customId}`)
                                    .setLabel('Suivant')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(page < pageCount - 1 ? false : true)
                            )
                            components.push(citiesButtons)

                            return components
                        }

                        let components = getComponents()

                        await interaction.reply({ content: 'Veuillez sélectionner votre ville :', components: components, ephemeral: true })

                        const filter = i => i.customId.includes(customId) && i.user.id === interaction.user.id

                        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 })

                        collector.on('collect', async i => {
                            const choice = i.customId

                            if(![`previous_${customId}`, `next_${customId}`].find(x => x === choice)) {
                                await i.deferUpdate()

                                const c = choice.split('_')
                                await city.set(interaction.user.id, c[0], c[1])

                                await i.editReply({ content: 'Votre ville d\'origine a bien été enregistrée', components: [] })

                                Logger.log('CityCommand', 'INFO', `${interaction.user.tag} a ajouté sa ville d'origine`)
                            } else {
                                collector.resetTimer()
                                await i.deferUpdate()

                                page = choice === `previous_${customId}` ? page - 1 : page + 1
                                components = getComponents(page)

                                await i.editReply({ content: 'Veuillez sélectionner votre ville :', components: components })
                            }
                        })

                        collector.on('end', async (collected, reason) => {
                            if(reason === 'time') {
                                await interaction.editReply({ content: 'Vous avez mis trop de temps à répondre', components: [] })
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