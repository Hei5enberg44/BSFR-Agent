const { CommandInteraction, ApplicationCommandOptionType } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError, BannedWordsError, BirthdayMessagesError } = require('../utils/error')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const maliciousURL = require('../controllers/maliciousURL')

module.exports = {
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
                        name: 'Mots à bannir',
                        value: 'bannedWords'
                    },
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

            let embed = new Embed().setColor('#F1C40F')

            switch(subject) {
                case 'bannedWords':
                    const wordsList = await bannedWords.list(page)
                    embed.setTitle('📒 Liste des mots bannis')
                    embed.addFields({ name: 'Messages', value: wordsList })
                    break
                case 'birthdayMessages':
                    const messagesList = await birthdayMessages.list(page)
                    embed.setTitle('📒 Liste des messages d\'anniversaire')
                    embed.addFields({ name: 'Messages', value: messagesList })
                    break
                case 'maliciousURL':
                    const urlsList = await maliciousURL.list(page)
                    embed.setTitle('📒 Liste des URLs malveillants')
                    embed.addFields({ name: 'URLs', value: urlsList })
                    break
            }

            await interaction.reply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError || error instanceof BannedWordsError || error instanceof BirthdayMessagesError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}