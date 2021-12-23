const { MessageEmbed, CommandInteraction } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'add',
		description: 'Ajouts divers',
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
                    }
                ],
                required: true
            },
            {
                type: 'STRING',
                name: 'texte',
                description: '/!\\ (Mots bannis uniquement) Si il y a plusieurs mots, merci de les séparer par un point virgule /!\\',
                required: true
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
            const text = interaction.options.getString('texte')

            let embed = new MessageEmbed()
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addField('Membre', interaction.user.tag)
                .setFooter(`${config.appName} ${config.appVersion}`, config.appLogo)

            switch(subject) {
                case 'bannedWords':
                    const wordsList = await bannedWords.add(text, interaction.user)

                    Logger.log('BannedWords', 'INFO', `${interaction.user.tag} a ajouté les mots bannis suivants : ${text.split(';').map(word => word.trim()).join(', ')}`)

                    embed.setColor('#E74C3C').setTitle('⛔ Ajout de mots bannis')

                    for(const [action, words] of Object.entries(wordsList)) {
                        if(words.length > 0) {
                            embed.addField(action === 'new' ? 'Ajouté' : 'Déjà ajouté', words.join(', '))
                        }
                    }

                    break
                case 'birthdayMessages':
                    const messagesList = await birthdayMessages.add(text, interaction.user)

                    Logger.log('BannedWords', 'INFO', `${interaction.user.tag} a ajouté le message d\'anniversaire suivant : ${text.trim()}`)

                    embed.setColor('#2ECC71').setTitle('🥳 Ajout d\'un message d\'anniversaire')

                    for(const [action, message] of Object.entries(messagesList)) {
                        if(message !== '') {
                            embed.addField(action === 'new' ? 'Ajouté' : 'Déjà ajouté', message)
                        }
                    }

                    break
            }

            await interaction.reply({ embeds: [embed] })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}