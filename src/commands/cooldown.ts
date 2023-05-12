import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import cooldown from '../controllers/cooldown.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    data: new SlashCommandBuilder()
        .setName('cooldown')
        .setDescription('Adds/Removes a member to/from the cooldown list')
        .setDescriptionLocalization('fr', 'Ajoute/Supprime un membre à la liste des cooldowns')
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setNameLocalization('fr', 'lister')
                .setDescription('List cooldowns')
                .setDescriptionLocalization('fr', 'Lister les cooldowns')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page to display')
                        .setDescriptionLocalization('fr', 'Page à afficher')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setNameLocalization('fr', 'ajouter')
                .setDescription('Add a member to the cooldown list')
                .setDescriptionLocalization('fr', 'Ajouter un membre à la liste des cooldowns')
                .addUserOption(option =>
                    option.setName('member')
                        .setNameLocalization('fr', 'membre')
                        .setDescription('Member to add to the cooldown list')
                        .setDescriptionLocalization('fr', 'Membre à ajouter à la liste des cooldowns')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('time_threshold')
                        .setNameLocalization('fr', 'seuil_temps')
                        .setDescription('Time threshold between first and last message sent (in seconds)')
                        .setDescriptionLocalization('fr', 'Seuil de temps entre le premier et le dernier message envoyé (en secondes)')
                        .setMinValue(1)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('count_threshold')
                        .setNameLocalization('fr', 'seuil_nombre')
                        .setDescription('Number of messages sent within the time threshold')
                        .setDescriptionLocalization('fr', 'Nombre de messages envoyés dans le seuil de temps')
                        .setMinValue(2)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('mute_duration')
                        .setNameLocalization('fr', 'durée_mute')
                        .setDescription('Member mute duration (in seconds)')
                        .setDescriptionLocalization('fr', 'Durée du mute du membre (en secondes)')
                        .setMinValue(1)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setNameLocalization('fr', 'supprimer')
                .setDescription('Remove a member from the cooldown list')
                .setDescriptionLocalization('fr', 'Supprimer un membre de la liste des cooldowns')
                .addUserOption(option =>
                    option.setName('member')
                        .setNameLocalization('fr', 'membre')
                        .setDescription('Member to remove from the cooldown list')
                        .setDescriptionLocalization('fr', 'Membre à supprimer de la liste des cooldowns')
                        .setRequired(true)
                )
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,

    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const action = interaction.options.getSubcommand()

            switch(action) {
                case 'list': {
                    const page = interaction.options.getInteger('page') ?? 1

                    if(page < 1) throw new CommandInteractionError(Locales.get(interaction.locale, 'page_error'))

                    const cooldownList = await cooldown.list(page)

                    const embed = new Embed()
                        .setColor('#F1C40F')
                        .setTitle(Locales.get(interaction.locale, 'cooldown_list'))
                        .setDescription(cooldownList.items.map(cooldown => Locales.get(interaction.locale, 'member_cooldown', userMention(cooldown.memberId), cooldown.timeThreshold, cooldown.countThreshold, cooldown.muteDuration)).join('\n'))
                        .addFields({ name: 'Page', value: Locales.get(interaction.locale, 'page_info', cooldownList.page, cooldownList.pageCount) })

                    await interaction.reply({ embeds: [embed], ephemeral: true })

                    break
                }
                case 'add': {
                    const member = interaction.options.getUser('member', true)

                    const memberCooldown = await cooldown.get(member.id)
                    if(memberCooldown) throw new CommandInteractionError(Locales.get(interaction.locale, 'already_in_cooldown_list', userMention(member.id)))

                    const timeThreshold = interaction.options.getInteger('time_threshold') ?? 10
                    const countThreshold = interaction.options.getInteger('count_threshold') ?? 3
                    const muteDuration = interaction.options.getInteger('mute_duration') ?? 10

                    await cooldown.add(member.id, timeThreshold, countThreshold, muteDuration)

                    Logger.log('CooldownCommand', 'INFO', `${interaction.user.tag} a ajouté le membre ${member.tag} au cooldown`)

                    const embed = new Embed()
                        .setColor('#2ECC71')
                        .setTitle(Locales.get(interaction.locale, 'added_cooldown'))
                        .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                        .addFields({ name: Locales.get(interaction.locale, 'member'), value: userMention(member.id) })

                    await interaction.reply({ embeds: [embed], ephemeral: true })

                    break
                }
                case 'remove': {
                    const member = interaction.options.getUser('member', true)

                    const memberCooldown = await cooldown.get(member.id)
                    if(!memberCooldown) throw new CommandInteractionError(Locales.get(interaction.locale, 'not_in_cooldown_list', userMention(member.id)))

                    await cooldown.remove(member.id)

                    Logger.log('CooldownCommand', 'INFO', `${interaction.user.tag} a supprimé le membre ${member.tag} du cooldown`)

                    const embed = new Embed()
                        .setColor('#2ECC71')
                        .setTitle(Locales.get(interaction.locale, 'deleted_cooldown'))
                        .setThumbnail(member.displayAvatarURL({ forceStatic: false }))
                        .addFields({ name: Locales.get(interaction.locale, 'member'), value: userMention(member.id) })

                    await interaction.reply({ embeds: [embed], ephemeral: true })

                    break
                }
            }
        } catch(error) {
            if(error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}