import { CommandInteraction, ApplicationCommandOptionType, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import cooldown from '../controllers/cooldown.js'
import Logger from '../utils/logger.js'

export default {
    data: {
        name: 'cooldown',
        description: 'Gestion des cooldowns',
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'list',
                description: 'Liste les membres en cooldown',
                options: [
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'page',
                        description: 'Page à afficher',
                        required: false
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: 'Ajoute un membre au cooldown',
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: 'membre',
                        description: 'Membre',
                        required: true
                    },
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'seuil_temps',
                        description: 'Laps de temps entre le premier et le dernier message envoyé (en secondes)',
                        minValue: 1,
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'seuil_nombre',
                        description: 'Nombre de messages envoyés dans le laps de temps',
                        minValue: 2,
                        required: false
                    },
                    {
                        type: ApplicationCommandOptionType.Integer,
                        name: 'durée_mute',
                        description: 'Durée du mute du membre (en secondes)',
                        minValue: 1,
                        required: false
                    }
                ]
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: 'Supprime un membre du cooldown',
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: 'membre',
                        description: 'Membre',
                        required: true
                    }
                ]
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
            const action = interaction.options.getSubcommand()

            switch(action) {
                case 'list': {
                    const page = interaction.options.getInteger('page') ?? 1

                    if(page < 1) throw new CommandInteractionError('Le numéro de page doit être supérieur ou égal à 1')

                    const cooldownList = await cooldown.list(page)

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setTitle('⏳ Liste des cooldowns')
                        .addFields({ name: 'Cooldowns', value: cooldownList })

                    await interaction.reply({ embeds: [embed] })

                    break
                }
                case 'add': {
                    const member = interaction.options.getUser('membre')

                    const memberCooldown = await cooldown.get(member.id)
                    if(memberCooldown) throw new CommandInteractionError(`${userMention(member.id)} est déjà en cooldown`)

                    const timeThreshold = interaction.options.getInteger('seuil_temps') ?? 10
                    const countThreshold = interaction.options.getInteger('seuil_nombre') ?? 3
                    const muteDuration = interaction.options.getInteger('durée_mute') ?? 10

                    await cooldown.add(member.id, timeThreshold, countThreshold, muteDuration)

                    Logger.log('CooldownCommand', 'INFO', `${interaction.user.tag} a ajouté le membre ${member.tag} au cooldown`)

                    const embed = new Embed()
                        .setColor('#2ECC71')
                        .setTitle('⏳ Ajout d\'un cooldown')
                        .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'Membre', value: userMention(member.id) }
                        )

                    await interaction.reply({ embeds: [embed] })

                    break
                }
                case 'remove': {
                    const member = interaction.options.getUser('membre')

                    const memberCooldown = await cooldown.get(member.id)
                    if(!memberCooldown) throw new CommandInteractionError(`${userMention(member.id)} n'est pas en cooldown`)

                    await cooldown.remove(member.id)

                    Logger.log('CooldownCommand', 'INFO', `${interaction.user.tag} a supprimé le membre ${member.tag} du cooldown`)

                    const embed = new Embed()
                        .setColor('#2ECC71')
                        .setTitle('⏳ Suppression d\'un cooldown')
                        .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'Membre', value: userMention(member.id) }
                        )

                    await interaction.reply({ embeds: [embed] })

                    break
                }
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