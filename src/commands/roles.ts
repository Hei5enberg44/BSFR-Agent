import {
    Guild,
    SlashCommandBuilder,
    InteractionContextType,
    PermissionFlagsBits,
    ChatInputCommandInteraction,
    GuildMemberRoleManager,
    roleMention,
    EmbedBuilder
} from 'discord.js'
import { CommandError } from '../utils/error.js'
import roles, { RoleListItem, RoleItem } from '../controllers/roles.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

const _roles = await roles.list()

export default {
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Auto role assignment')
        .setDescriptionLocalization('fr', 'Assignation auto de rôles')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('list')
                .setNameLocalization('fr', 'lister')
                .setDescription('List your roles')
                .setDescriptionLocalization('fr', 'Lister vos rôles')
        )
        .addSubcommandGroup((subcommandgroup) => {
            subcommandgroup
                .setName('add')
                .setNameLocalization('fr', 'ajouter')
                .setDescription('Add a role')
                .setDescriptionLocalization('fr', 'Ajouter un rôle')

            for (const roleCategory of _roles) {
                subcommandgroup.addSubcommand((subcommand) =>
                    subcommand
                        .setName(roleCategory.id)
                        .setNameLocalizations(roleCategory.idLocalizations)
                        .setDescription(
                            `Add a role for category « ${roleCategory.categoryNameLocalizations['en-US']} »`
                        )
                        .setDescriptionLocalization(
                            'fr',
                            `Ajouter un rôle pour la catégorie « ${roleCategory.categoryNameLocalizations['fr']} »`
                        )
                        .addStringOption((option) =>
                            option
                                .setName('role')
                                .setDescription(
                                    `Role for category « ${roleCategory.categoryNameLocalizations['en-US']} » to add`
                                )
                                .setDescriptionLocalization(
                                    'fr',
                                    `Rôle de la catégorie « ${roleCategory.categoryNameLocalizations['fr']} » à ajouter`
                                )
                                .addChoices(
                                    ...roleCategory.roles.map((r) => {
                                        return {
                                            name: r.nameLocalizations['en-US'],
                                            name_localizations: {
                                                fr: r.nameLocalizations['fr']
                                            },
                                            value: r.name
                                        }
                                    })
                                )
                                .setRequired(true)
                        )
                )
            }

            return subcommandgroup
        })
        .addSubcommandGroup((subcommandgroup) => {
            subcommandgroup
                .setName('remove')
                .setNameLocalization('fr', 'supprimer')
                .setDescription('Remove a role')
                .setDescriptionLocalization('fr', 'Supprimer un rôle')

            for (const roleCategory of _roles) {
                subcommandgroup.addSubcommand((subcommand) =>
                    subcommand
                        .setName(roleCategory.id)
                        .setNameLocalizations(roleCategory.idLocalizations)
                        .setDescription(
                            `Remove a role for category « ${roleCategory.categoryNameLocalizations['en-US']} »`
                        )
                        .setDescriptionLocalization(
                            'fr',
                            `Supprimer un rôle pour la catégorie « ${roleCategory.categoryNameLocalizations['fr']} »`
                        )
                        .addStringOption((option) =>
                            option
                                .setName('role')
                                .setDescription(
                                    `Role for category « ${roleCategory.categoryNameLocalizations['en-US']} » to remove`
                                )
                                .setDescriptionLocalization(
                                    'fr',
                                    `Rôle de la catégorie « ${roleCategory.categoryNameLocalizations['fr']} » à supprimer`
                                )
                                .addChoices(
                                    ...roleCategory.roles.map((r) => {
                                        return {
                                            name: r.nameLocalizations['en-US'],
                                            name_localizations: {
                                                fr: r.nameLocalizations['fr']
                                            },
                                            value: r.name
                                        }
                                    })
                                )
                                .setRequired(true)
                        )
                )
            }

            return subcommandgroup
        })
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    /**
     * Exécution de la commande
     * @param interaction interaction Discord
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const subCommand = interaction.options.getSubcommand(true)
            const subCommandGroup =
                interaction.options.getSubcommandGroup(false)

            const action = subCommand === 'list' ? subCommand : subCommandGroup

            const guild = interaction.guild as Guild

            const memberRoles = (
                interaction.member?.roles as GuildMemberRoleManager
            ).cache

            const embed = new EmbedBuilder()

            switch (action) {
                case 'list': {
                    let roleList: Record<string, string[]> = {}
                    for (const group of _roles) {
                        for (const role of group.roles) {
                            if (memberRoles.find((r) => r.name === role.name)) {
                                const roleCategory =
                                    group.categoryNameLocalizations[
                                        interaction.locale
                                    ] ?? group.categoryName
                                const roleName =
                                    role.nameLocalizations[
                                        interaction.locale
                                    ] ?? role.name
                                if (!roleList[roleCategory])
                                    roleList[roleCategory] = []
                                roleList[roleCategory].push(roleName)
                            }
                        }
                    }

                    embed
                        .setColor('#F1C40F')
                        .setTitle(Locales.get(interaction.locale, 'list_roles'))
                        .setThumbnail(
                            interaction.user.displayAvatarURL({
                                forceStatic: false
                            })
                        )

                    if (Object.keys(roleList).length > 0) {
                        for (const [group, roles] of Object.entries(roleList)) {
                            embed.addFields({
                                name: group,
                                value: roles.join('\n'),
                                inline: true
                            })
                        }
                    } else {
                        embed.setDescription(
                            Locales.get(interaction.locale, 'no_role_error')
                        )
                    }

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    })

                    break
                }
                case 'add': {
                    const roleGroupId = subCommand
                    const roleGroup = _roles.find(
                        (g) => g.id === roleGroupId
                    ) as RoleListItem
                    const roleGrouproleList = roleGroup.roles

                    const roleToAdd = roleGrouproleList.find(
                        (r) =>
                            r.name ===
                            interaction.options.getString('role', true)
                    ) as RoleItem

                    embed.setTitle(Locales.get(interaction.locale, 'role_add'))

                    const role = guild.roles.cache.find(
                        (r) => r.name === roleToAdd.name
                    )
                    if (role) {
                        // On vérifie si le membre possède déjà le rôle qu'il souhaite ajouter
                        if (
                            memberRoles.find((r) => r.name === roleToAdd.name)
                        ) {
                            embed
                                .setColor('#E74C3C')
                                .setDescription(
                                    Locales.get(
                                        interaction.locale,
                                        'already_have_role_error',
                                        roleMention(role.id)
                                    )
                                )
                        } else {
                            // On vérifie si plusieurs rôles de ce même groupe peuvent être attibués simultanément
                            const error =
                                !roleToAdd?.multiple &&
                                roleGrouproleList
                                    .filter((rl) =>
                                        memberRoles
                                            .map((mr) => mr.name)
                                            .includes(rl.name)
                                    )
                                    .find((r) => !r.multiple)
                                    ? true
                                    : false
                            if (error) {
                                embed
                                    .setColor('#E74C3C')
                                    .setDescription(
                                        Locales.get(
                                            interaction.locale,
                                            'already_have_role_for_category_error',
                                            roleGroup.categoryNameLocalizations[
                                                interaction.locale
                                            ] ??
                                                roleGroup
                                                    .categoryNameLocalizations[
                                                    'en-US'
                                                ],
                                            roleMention(role.id)
                                        )
                                    )
                            } else {
                                Logger.log(
                                    'RolesCommand',
                                    'INFO',
                                    `Le membre ${interaction.user.username} possède maintenant le rôle @${role.name}`
                                )
                                await (
                                    interaction.member
                                        ?.roles as GuildMemberRoleManager
                                ).add(role)
                                embed
                                    .setColor('#2ECC71')
                                    .setDescription(
                                        Locales.get(
                                            interaction.locale,
                                            'role_added',
                                            roleMention(role.id)
                                        )
                                    )
                            }
                        }
                    } else {
                        embed
                            .setColor('#E74C3C')
                            .setDescription(
                                Locales.get(
                                    interaction.locale,
                                    'role_does_not_exist_error',
                                    roleToAdd.name
                                )
                            )
                    }

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    })

                    break
                }
                case 'remove': {
                    const roleGroupId = subCommand
                    const roleGroup = _roles.find(
                        (g) => g.id === roleGroupId
                    ) as RoleListItem
                    const roleGrouproleList = roleGroup.roles

                    const roleToRemove = roleGrouproleList.find(
                        (r) =>
                            r.name ===
                            interaction.options.getString('role', true)
                    ) as RoleItem

                    embed.setTitle(
                        Locales.get(interaction.locale, 'role_remove')
                    )

                    const role = guild.roles.cache.find(
                        (r) => r.name === roleToRemove.name
                    )
                    if (role) {
                        // On vérifie si le membre possède le rôle qu'il souhaite supprimer
                        if (
                            !memberRoles.find(
                                (r) => r.name === roleToRemove.name
                            )
                        ) {
                            embed
                                .setColor('#E74C3C')
                                .setDescription(
                                    Locales.get(
                                        interaction.locale,
                                        'have_not_role_error',
                                        roleMention(role.id)
                                    )
                                )
                        } else {
                            Logger.log(
                                'RolesCommand',
                                'INFO',
                                `Le membre ${interaction.user.username} ne possède plus le rôle @${role.name}.`
                            )
                            await (
                                interaction.member
                                    ?.roles as GuildMemberRoleManager
                            ).remove(role)
                            embed
                                .setColor('#2ECC71')
                                .setDescription(
                                    Locales.get(
                                        interaction.locale,
                                        'role_removed',
                                        roleMention(role.id)
                                    )
                                )
                        }
                    } else {
                        embed
                            .setColor('#E74C3C')
                            .setDescription(
                                Locales.get(
                                    interaction.locale,
                                    'role_does_not_exist_error',
                                    roleToRemove.name
                                )
                            )
                    }

                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true
                    })

                    break
                }
            }
        } catch (error) {
            if (error.name === 'COMMAND_INTERACTION_ERROR') {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}
