const { MessageEmbed, CommandInteraction } = require('discord.js')
const { CommandError, CommandInteractionError, BannedWordsError, BirthdayMessagesError } = require('../utils/error')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const maliciousURL = require('../controllers/maliciousURL')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'list',
		description: 'Listes divers',
        options: [
            {
                type: 'STRING',
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
                type: 'INTEGER',
                name: 'page',
                description: 'Page à afficher',
                required: false
            }
        ],
        defaultPermission: false
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

            let embed = new MessageEmbed()
                .setColor('#F1C40F')
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })

            switch(subject) {
                case 'bannedWords':
                    const wordsList = await bannedWords.list(page)

                    embed.setTitle('📒 Liste des mots bannis')
                    embed.addField('Messages', wordsList)

                    break
                case 'birthdayMessages':
                    const messagesList = await birthdayMessages.list(page)

                    embed.setTitle('📒 Liste des messages d\'anniversaire')
                    embed.addField('Messages', messagesList)

                    break
                case 'maliciousURL':
                    const urlsList = await maliciousURL.list(page)

                    embed.setTitle('📒 Liste des URLs malveillants')
                    embed.addField('URLs', urlsList)

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