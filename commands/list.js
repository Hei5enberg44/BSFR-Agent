import { CommandInteraction, ApplicationCommandOptionType } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError, BirthdayMessagesError } from '../utils/error.js'
import birthdayMessages from '../controllers/birthdayMessages.js'
import maliciousURL from '../controllers/maliciousURL.js'

export default {
    data: {
        name: 'list',
        description: 'Listes diverses',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'sujet',
                description: 'Sujet',
                choices: [
                    {
                        name: 'Messages d\'anniversaire',
                        value: 'birthdayMessages'
                    },
                    {
                        name: 'URL malveillants',
                        value: 'maliciousURL'
                    }
                ],
                required: true
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'page',
                description: 'Page à afficher',
                required: false
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],
    channels: [ 'agentCommands' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const subject = interaction.options.getString('sujet')
            const page = interaction.options.getInteger('page') ?? 1

            if(page < 1) throw new CommandInteractionError('Le numéro de page doit être supérieur ou égal à 1')

            const embed = new Embed().setColor('#F1C40F')

            switch(subject) {
                case 'birthdayMessages': {
                    const messageList = await birthdayMessages.list(page)
                    embed.setTitle('📒 Liste des messages d\'anniversaire')
                    embed.addFields({ name: 'Messages', value: messageList })
                    break
                }
                case 'maliciousURL': {
                    const urlList = await maliciousURL.list(page)
                    embed.setTitle('📒 Liste des URLs malveillants')
                    embed.addFields({ name: 'URLs', value: urlList })
                    break
                }
            }

            await interaction.reply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof BirthdayMessagesError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}