import { CommandInteraction, ApplicationCommandOptionType } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import birthdayMessages from '../controllers/birthdayMessages.js'
import maliciousURL from '../controllers/maliciousURL.js'
import Logger from '../utils/logger.js'

export default {
    data: {
        name: 'add',
        description: 'Ajouts divers',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'sujet',
                description: 'Sujet',
                choices: [
                    {
                        name: 'Message d\'anniversaire',
                        value: 'birthdayMessage'
                    },
                    {
                        name: 'URL malveillant',
                        value: 'maliciousURL'
                    }
                ],
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'texte',
                description: '/!\\ (Mots bannis uniquement) Si il y a plusieurs mots, merci de les séparer par un point virgule /!\\',
                required: true
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
            const text = interaction.options.getString('texte')

            let embed = new Embed()
                .setColor('#2ECC71')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields({ name: 'Membre', value: interaction.user.tag })

            switch(subject) {
                case 'birthdayMessage':
                    const messagesList = await birthdayMessages.add(text, interaction.user)

                    Logger.log('BirthdayMessages', 'INFO', `${interaction.user.tag} a ajouté le message d'anniversaire suivant : ${text.trim()}`)

                    embed.setTitle('🥳 Ajout d\'un message d\'anniversaire')

                    for(const [action, message] of Object.entries(messagesList)) {
                        if(message !== '') {
                            embed.addFields({ name: action === 'new' ? 'Ajouté' : 'Déjà ajouté', value: message })
                        }
                    }

                    break
                case 'maliciousURL':
                    const urlsList = await maliciousURL.add(text, interaction.user)

                    Logger.log('MaliciousURL', 'INFO', `${interaction.user.tag} a ajouté l'URL malveillant suivant : ${text.trim()}`)

                    embed.setTitle('☣️ Ajout d\'un URL malveillant')

                    for(const [action, url] of Object.entries(urlsList)) {
                        if(url !== '') {
                            embed.addFields({ name: action === 'new' ? 'Ajouté' : 'Déjà ajouté', value: url })
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