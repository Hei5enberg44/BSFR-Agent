const { CommandInteraction, ApplicationCommandOptionType } = require('discord.js')
const { CommandError, CommandInteractionError } = require('../utils/error')
const twitch = require('../controllers/twitch')
const Logger = require('../utils/logger')

module.exports = {
    data: {
        name: 'twitch',
        description: 'Lie votre compte Twitch afin d\'activer les notifications lorsque vous êtes en live',
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'link',
                description: 'Lie votre compte Twitch',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'chaine',
                        description: 'Nom de votre chaîne Twitch',
                        required: true
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'unlink',
                description: 'Délie votre compte Twitch'
            }
        ],
        default_member_permissions: '0'
    },
    channels: [ 'twitch' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const action = interaction.options.getSubcommand()

            switch(action) {
                case 'link':
                    const channelName = interaction.options.getString('chaine')

                    if(channelName.match(/^https?:\/\//)) throw new CommandInteractionError('Merci de renseigner le nom de votre chaîne Twitch et non son URL')

                    await twitch.link(interaction.user.id, channelName)

                    Logger.log('TwitchCommand', 'INFO', `${interaction.user.tag} a lié son compte Twitch`)

                    await interaction.reply({ content: 'Votre compte Twitch a bien été lié à votre profil Discord', ephemeral: true })
                    break
                case 'unlink':
                    await twitch.unlink(interaction.user.id)

                    Logger.log('TwitchCommand', 'INFO', `${interaction.user.tag} a délié son compte Twitch`)

                    await interaction.reply({ content: 'Votre compte Twitch a bien été délié de votre profil Discord', ephemeral: true })
                    break
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