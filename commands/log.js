import { AttachmentBuilder, CommandInteraction, ApplicationCommandOptionType } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import * as fs from 'node:fs'

export default {
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
            let date = interaction.options.getString('date') ?? new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })

            if(!date.match(/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/))
                throw new CommandInteractionError('Date invalide. La date doit être au format JJ/MM/AAAA.')

            const splitedDate = date.split('/')
            date = `${splitedDate[2]}-${splitedDate[1]}-${splitedDate[0]}`

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