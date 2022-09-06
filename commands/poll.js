const { CommandInteraction, ApplicationCommandOptionType, time } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const poll = require('../controllers/poll')

module.exports = {
    data: {
        name: 'poll',
        description: 'Créer un sondage',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'titre',
                description: 'Titre du sondage',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'liste',
                description: 'Liste des propositions séparées par un point virgule (max. 8)',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'date_fin',
                description: 'Date de fin du sondage au format JJ/MM/AAAA HH:II (ex: 07/09/2022 15:30)',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const title = interaction.options.getString('titre')
            const list = interaction.options.getString('liste')
            const date = interaction.options.getString('date_fin')

            const propositions = list.split(';')
            if(propositions.length > 8) throw new CommandInteractionError('Le nombre de propositions doit être inférieur ou égal à 8.')

            if(!date.match(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}\s([0-1][0-9]|2[0-3]):[0-5][0-9]$/))
                throw new CommandInteractionError('Date invalide. La date doit être au format JJ/MM/AAAA HH:II.')

            const dateDate = date.split(' ')[0]
            const dateTime = date.split(' ')[1]
            
            const dateEnd = new Date(dateDate.split('/')[2], dateDate.split('/')[1] - 1, dateDate.split('/')[0], dateTime.split(':')[0], dateTime.split(':')[1]).getTime()

            if(dateEnd <= Date.now()) throw new CommandInteractionError('La date de fin ne peut pas être passée.')
        
            const embed = new Embed()
                .setColor('#F1C40F')
                .setTitle(title)
                .setDescription(propositions.map((p, i) => {
                    return `${poll.reactions[i]} : ${p} (0% - 0 vote)`
                }).join('\n') + `\n\nDate de fin: ${time(new Date(dateEnd))}`)

            const message = await interaction.reply({ embeds: [embed], fetchReply: true })

            await poll.create(title, propositions, dateEnd, interaction.user.id, interaction.channel.id, message.id)
            
            for(let i = 0; i < propositions.length; i++) {
                await message.react(poll.reactions[i])
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