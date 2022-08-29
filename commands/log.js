const { AttachmentBuilder, CommandInteraction, ApplicationCommandOptionType } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const fs = require('fs')

module.exports = {
    data: {
        name: 'log',
        description: 'Récupère un fichier de log',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'date',
                description: 'Date du fichier de log demandé au format JJ/MM/AAAA (ex: 19/12/2021)',
                required: false
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],
    channels: [ 'logs' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const rawDate = new Date()
            let date = interaction.options.getString('date') ?? ('0' + rawDate.getDate()).slice(-2) + '/' + ('0' + (rawDate.getUTCMonth() + 1)).slice(-2) + '/' + rawDate.getFullYear()

            if(!date.match(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/))
                throw new CommandInteractionError('Date invalide. La date doit être au format JJ/MM/AAAA.')

            const splitedDate = date.split("/")
            date = splitedDate[2] + "-" + splitedDate[1] + "-" + splitedDate[0]

            const path = `./logs/${date}.log`

            if(!fs.existsSync(path)) throw new CommandInteractionError('Le fichier demandé n\'existe pas.')

            const attachment = new AttachmentBuilder(path, { name: `${date}.log` })

            await interaction.reply({ files: [attachment] })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}