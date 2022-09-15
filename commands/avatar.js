import { CommandInteraction, ApplicationCommandOptionType, ALLOWED_EXTENSIONS, ALLOWED_SIZES } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'

export default {
    data: {
        name: 'avatar',
        description: 'Récupère l\'avatar d\'un membre',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'membre',
                description: 'Membre pour lequel récupérer l\'avatar',
                required: false
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'extension',
                description: 'Extension de l\'image',
                choices: ALLOWED_EXTENSIONS.map(extension => {
                    return { name: extension, value: extension }
                }),
                required: false
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'taille',
                description: 'Taille de l\'image',
                choices: ALLOWED_SIZES.map(size => {
                    return { name: size, value: size }
                }),
                required: false
            },
            {
                type: ApplicationCommandOptionType.Boolean,
                name: 'statique',
                description: 'Force l\'affichage statique de l\'image',
                required: false
            }
        ],
        default_member_permissions: '0'
    },

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
    async execute(interaction) {
        try {
            const member = interaction.options.getUser('membre') ?? interaction.user
            const extension = interaction.options.getString('extension') ?? ALLOWED_EXTENSIONS[1]
            const size = interaction.options.getInteger('taille') ?? ALLOWED_SIZES[6]
            const forceStatic = interaction.options.getBoolean('statique') ?? true

            const avatarUrl = member.displayAvatarURL({ extension: extension, size: size, forceStatic: forceStatic })

            await interaction.reply({ content: avatarUrl })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}