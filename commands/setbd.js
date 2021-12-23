const { CommandError, CommandInteractionError } = require('../utils/error')
const birthday = require('../controllers/birthday')
const Logger = require('../utils/logger')
const { CommandInteraction } = require('discord.js')

module.exports = {
	data: {
		name: 'setbd',
		description: 'Assigne une date d\'anniversaire',
        options: [
            {
                type: 'STRING',
                name: 'date',
                description: 'Ta date d\'anniversaire au format JJ/MM/AAAA (ex: 11/06/2000)',
                required: true
            }
        ]
    },
    channels: [ 'birthday' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const date = interaction.options.getString('date')

            if(!date.match(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/))
                throw new CommandInteractionError('Date invalide. La date doit être au format JJ/MM/AAAA.')

            const bdDate = new Date(date.split('/')[2], date.split('/')[1] - 1, date.split('/')[0]).getTime()

            if(bdDate > new Date().getTime())
                throw new CommandInteractionError('Bien essayé petit malin 😉')

            await birthday.set(interaction.user.id, bdDate)

            Logger.log('SetbdCommand', 'INFO', `${interaction.user.tag} a enregistré sa date de naissance`)

            await interaction.reply({ content: 'Votre date de naissance a bien été enregistrée', ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}