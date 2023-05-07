import { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, ALLOWED_EXTENSIONS, ALLOWED_SIZES } from 'discord.js'
import { CommandError } from '../utils/error.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Retrieves a member\'s avatar')
        .setDescriptionLocalization('fr', 'Récupère l\'avatar d\'un membre')
        .addUserOption(option =>
            option.setName('member')
                .setNameLocalization('fr', 'membre')
                .setDescription('Member for which to retrieve the avatar')
                .setDescriptionLocalization('fr', 'Membre pour lequel récupérer l\'avatar')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('extension')
                .setDescription('Image extension')
                .setDescriptionLocalization('fr', 'Extension de l\'image')
                .setChoices(
                    ...ALLOWED_EXTENSIONS.map(extension => {
                        return { name: extension, value: extension }
                    })
                )
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('size')
                .setNameLocalization('fr', 'taille')
                .setDescription('Image size')
                .setDescriptionLocalization('fr', 'Taille de l\'image')
                .setChoices(
                    ...ALLOWED_SIZES.map(size => {
                        return { name: size.toString(), value: size }
                    })
                )
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('static')
                .setNameLocalization('fr', 'statique')
                .setDescription('Display the static version of the image')
                .setDescriptionLocalization('fr', 'Afficher la version statique de l\'image')
                .setRequired(false)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,
    allowedChannels: [
        config.guild.channels['bot-setup']
    ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            const member = interaction.options.getUser('member') ?? interaction.user
            /** @type {(typeof ALLOWED_EXTENSIONS)[number]} */
            const extension = interaction.options.getString('extension') ?? 'png'
            /** @type {(typeof ALLOWED_SIZES)[number]} */
            const size = interaction.options.getInteger('size') ?? 1024
            /** @type {boolean} */
            const forceStatic = interaction.options.getBoolean('static') ?? true

            const avatarUrl = member.displayAvatarURL({ extension: extension, size: size, forceStatic: forceStatic })

            await interaction.reply({ content: avatarUrl, ephemeral: true })
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}