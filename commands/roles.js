const { CommandInteraction } = require('discord.js')
const { roleMention, bold } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const roles = require('../roles.json')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'roles',
		description: 'Assignation auto de rôles',
        options: [
            {
                type: 'SUB_COMMAND',
                name: 'list',
                description: 'Liste vos rôles'
            },
            {
                type: 'SUB_COMMAND_GROUP',
                name: 'add',
                description: 'Ajoute un rôle',
                options: roles.map((g, i) => {
                    roles[i].id = g.category.toLowerCase().replace(/\s/g, '')
                    return {
                        type: 'SUB_COMMAND',
                        name: g.id,
                        description: `Ajoute un rôle de ${g.category.toLowerCase()}`,
                        options: [
                            {
                                type: 'STRING',
                                name: 'role',
                                description: `Rôle de ${g.category.toLowerCase()} à ajouter`,
                                choices: g.roles.map(r => {
                                    return { name: r.name, value: r.name }
                                }),
                                required: true
                            }
                        ]
                    }
                })
            },
            {
                type: 'SUB_COMMAND_GROUP',
                name: 'remove',
                description: 'Supprime un rôle',
                options: roles.map((g, i) => {
                    roles[i].id = g.category.toLowerCase().replace(/\s/g, '')
                    return {
                        type: 'SUB_COMMAND',
                        name: g.id,
                        description: `Supprime un rôle de ${g.category.toLowerCase()}`,
                        options: [
                            {
                                type: 'STRING',
                                name: 'role',
                                description: `Rôle de ${g.category.toLowerCase()} à supprimer`,
                                choices: g.roles.map(r => {
                                    return { name: r.name, value: r.name }
                                }),
                                required: true
                            }
                        ]
                    }
                })
            }
        ],
        default_member_permissions: '0'
    },
    channels: [ 'rolesAutoAssignables' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const subCommand = interaction.options.getSubcommand(false)
            const subCommandGroup = interaction.options.getSubcommandGroup(false)

            const action = subCommand === 'list' ? subCommand : subCommandGroup

            const memberRoles = interaction.member.roles.cache

            const embed = new Embed()

            let roleGroupId, roleGroup, roleGroupRolesList, role
            switch(action) {
                case 'list':
                    const rolesList = {}
                    for(const group of roles) {
                        for(const role of group.roles) {
                            if(memberRoles.find(r => r.name === role.name)) {
                                if(!rolesList[group.category]) rolesList[group.category] = []
                                rolesList[group.category].push(role.name)
                            }
                        }
                    }

                    embed.setColor('#F1C40F')
                        .setTitle('Liste de vos rôles')
                        .setThumbnail(interaction.member.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })

                    if(Object.keys(rolesList).length > 0) {
                        for(const [group, roles] of Object.entries(rolesList)) {
                            embed.addField(group, roles.join('\n'), true)
                        }
                    } else {
                        embed.setDescription('Vous n\'avez aucun rôle')
                    }

                    await interaction.reply({ embeds: [embed] })

                    break
                case 'add':
                    roleGroupId = subCommand
                    roleGroup = roles.find(g => g.id === roleGroupId)
                    roleGroupRolesList = roleGroup.roles
                    const roleToAdd = roleGroupRolesList.find(r => r.name === interaction.options.getString('role'))

                    embed.setTitle('Ajout de rôle')

                    role = interaction.guild.roles.cache.find(r => r.name === roleToAdd.name)
                    if(role) {
                        // On vérifie si le membre possède déjà le rôle qu'il souhaite ajouter
                        if(memberRoles.find(r => r.name === roleToAdd.name)) {
                            embed.setColor('#E74C3C').setDescription(`Vous possédez déjà le rôle ${roleMention(role.id)}.`)
                        } else {
                            // On vérifie si plusieurs rôles de ce même groupe peuvent être attibués simultanément
                            const error = (!roleToAdd.multiple && roleGroupRolesList.filter(rl => memberRoles.map(mr => mr.name).includes(rl.name)).find(r => !r.multiple)) ? true : false
                            if(error) {
                                embed.setColor('#E74C3C').setDescription(`Vous possédez déjà un rôle de ${bold(roleGroup.category)}.\nVeuillez le supprimer avant de pouvoir ajouter le rôle ${roleMention(role.id)}.`)
                            } else {
                                Logger.log('RolesCommand', 'INFO', `Le membre ${interaction.user.tag} possède maintenant le rôle @${role.name}`)
                                await interaction.member.roles.add(role)
                                embed.setColor('#2ECC71').setDescription(`Vous possédez maintenant le rôle ${roleMention(role.id)}.`)
                            }
                        }
                    } else {
                        embed.setColor('#E74C3C').setDescription(`Le rôle « ${roleToAdd.name} » n'existe pas.`)
                    }

                    await interaction.reply({ embeds: [embed] })

                    break
                case 'remove':
                    roleGroupId = subCommand
                    roleGroup = roles.find(g => g.id === roleGroupId)
                    roleGroupRolesList = roleGroup.roles
                    const roleToRemove = roleGroupRolesList.find(r => r.name === interaction.options.getString('role'))

                    embed.setTitle('Suppression de rôle')
                    
                    role = interaction.guild.roles.cache.find(r => r.name === roleToRemove.name)
                    if(role) {
                        // On vérifie si le membre possède le rôle qu'il souhaite supprimer
                        if(!memberRoles.find(r => r.name === roleToRemove.name)) {
                            embed.setColor('#E74C3C').setDescription(`Vous ne possédez pas le rôle ${roleMention(role.id)}.`)
                        } else {
                            Logger.log('RolesCommand', 'INFO', `Le membre ${interaction.user.tag} ne possède plus le rôle @${role.name}.`)
                            await interaction.member.roles.remove(role)
                            embed.setColor('#2ECC71').setDescription(`Vous ne possédez plus le rôle ${roleMention(role.id)}.`)
                        }
                    } else {
                        embed.setColor('#E74C3C').setDescription(`Le rôle « ${roleToRemove.name} » n'existe pas.`)
                    }

                    await interaction.reply({ embeds: [embed] })

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