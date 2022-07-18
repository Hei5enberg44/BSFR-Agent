const { CommandInteraction, ApplicationCommandOptionType } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const bannedWords = require('../controllers/bannedWords')
const birthdayMessages = require('../controllers/birthdayMessages')
const maliciousURL = require('../controllers/maliciousURL')

module.exports = {
	data: {
		name: 'remove',
		description: 'Suppressions diverses',
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
                        name: 'URLs malveillants',
                        value: 'maliciousURL'
                    }
                ],
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'ids',
                description: '/!\\ Si il y a plusieurs IDs, merci de les séparer par un point virgule /!\\',
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
            const ids = interaction.options.getString('ids')

            let embed = new Embed()
                .setColor('#9B59B6')
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .addFields({ name: 'Membre', value: interaction.user.tag })
            
            let reply

            switch(subject) {
                case 'bannedWords':
                    const wordsList = await bannedWords.get(ids)

                    if(wordsList.length === 0)
                        throw new CommandInteractionError('Aucun mot banni à supprimer trouvé')

                    embed.setTitle('🗑️ Confirmation de la suppression de mots bannis')
                    embed.setDescription('Êtes-vous sûr de vouloir supprimer les mots à bannir suivants ?')
                    embed.addFields({ name: 'Mots à bannir', value: wordsList.map(word => word.word).join('\n') })

                    reply = await interaction.reply({ embeds: [embed], fetchReply: true })

                    await bannedWords.remove(wordsList, interaction.user.id, interaction.channelId, reply.id)

                    break
                case 'birthdayMessages':
                    const messagesList = await birthdayMessages.get(ids)

                    if(messagesList.length === 0)
                        throw new CommandInteractionError('Aucun message d\'anniversaire à supprimer trouvé')

                    embed.setTitle('🗑️ Confirmation de la suppression de messages d\'anniversaire')
                    embed.setDescription('Êtes-vous sûr de vouloir supprimer les messages d\'anniversaire suivants ?')
                    embed.addFields({ name: 'Messages d\'anniversaire', value: messagesList.map(message => message.message).join('\n') })

                    reply = await interaction.reply({ embeds: [embed], fetchReply: true })

                    await birthdayMessages.remove(messagesList, interaction.user.id, interaction.channelId, reply.id)

                    break
                case 'maliciousURL':
                    const urlsList = await maliciousURL.get(ids)

                    if(urlsList.length === 0)
                        throw new CommandInteractionError('Aucun URL malveillant à supprimer trouvé')

                    embed.setTitle('🗑️ Confirmation de la suppression d\'URL malveillant')
                    embed.setDescription('Êtes-vous sûr de vouloir supprimer les URLs malveillants suivants ?')
                    embed.addFields({ name: 'URLs malveillants', value: urlsList.map(url => url.url).join('\n') })

                    reply = await interaction.reply({ embeds: [embed], fetchReply: true })

                    await maliciousURL.remove(urlsList, interaction.user.id, interaction.channelId, reply.id)

                    break
            }

            await reply.react('✅')
            await reply.react('❌')
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}