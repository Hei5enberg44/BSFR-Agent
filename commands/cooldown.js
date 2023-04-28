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
                name: 'add',
                description: 'Ajoute un membre au cooldown',
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: 'membre',
                        description: 'Membre',
                        required: true
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
            },
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
            const member = interaction.options.getUser('membre')

            const memberCooldown = await cooldown.get(member.id)

            switch(action) {
                case 'add': {
                    if(memberCooldown) throw new CommandInteractionError(`${userMention(member.id)} est déjà en cooldown`)

                    await cooldown.add(member.id)

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