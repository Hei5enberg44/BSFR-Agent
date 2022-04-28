const { CommandInteraction } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const birthday = require('../controllers/birthday')
const Logger = require('../utils/logger')

module.exports = {
	data: {
		name: 'birthday',
		description: 'Ajoute/Supprime une date d\'anniversaire',
        options: [
            {
                type: 'SUB_COMMAND',
                name: 'set',
                description: 'Ajoute une date d\'anniversaire',
                options: [
                    {
                        type: 'STRING',
                        name: 'date',
                        description: 'Ta date d\'anniversaire au format JJ/MM/AAAA (ex: 11/06/2000)',
                        required: true
                    }
                ]
            },
            {
                type: 'SUB_COMMAND',
                name: 'unset',
                description: 'Supprime une date d\'anniversaire'
            }
        ],
        default_member_permissions: '0'
    },
    channels: [ 'birthday' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const action = interaction.options.getSubcommand()

            switch(action) {
                case 'set':
                    const date = interaction.options.getString('date')

                    if(!date.match(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/))
                        throw new CommandInteractionError('Date invalide. La date doit être au format JJ/MM/AAAA.')

                    const bdDate = new Date(date.split('/')[2], date.split('/')[1] - 1, date.split('/')[0]).getTime()

                    if(bdDate > new Date().getTime())
                        throw new CommandInteractionError('Bien essayé petit malin 😉')

                    await birthday.set(interaction.user.id, bdDate)

                    Logger.log('BirthdayCommand', 'INFO', `${interaction.user.tag} a enregistré sa date de naissance`)

                    await interaction.reply({ content: 'Votre date de naissance a bien été enregistrée', ephemeral: true })
                    break
                case 'unset':
                    await birthday.unset(interaction.user.id)

                    Logger.log('BirthdayCommand', 'INFO', `${interaction.user.tag} a supprimé sa date de naissance`)

                    await interaction.reply({ content: 'Votre date de naissance a bien été supprimée', ephemeral: true })
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