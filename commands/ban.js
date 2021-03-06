const { CommandInteraction, ApplicationCommandOptionType, bold, inlineCode, userMention, roleMention } = require('discord.js')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const ban = require('../controllers/ban')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'ban',
		description: 'Bannit un utilisateur sur une période donnée',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'membre',
                description: 'Membre',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'raison',
                description: 'Raison',
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'durée',
                description: 'Durée (s = secondes / i = minutes / h = heures / d = jours / w = semaines / m = mois / y = année)',
                required: true
            }
        ],
        default_member_permissions: '0'
    },
    roles: [ 'Admin', 'Modérateur' ],

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction intéraction Discord
     */
	async execute(interaction) {
        try {
            const member = interaction.options.getUser('membre')
            const reason = interaction.options.getString('raison')
            const duration = interaction.options.getString('durée')

            const isBanned = await ban.isBanned(member.id)
            if(isBanned) throw new CommandInteractionError(isBanned.approvedBy ? `${userMention(member.id)} est déjà banni` : `Il existe déjà une demande de ban à l'encontre de ${userMention(member.id)}`)

            const date = ban.getUnbanDate(duration)

            if(!date) throw new CommandInteractionError('Durée invalide : ' + duration)

            const adminChannel = interaction.guild.channels.cache.get(config.guild.channels.admin)
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles['Muted'])

            let askForBan = true
            if(interaction.member.roles.cache.find(r => r.id === config.guild.roles['Admin'] || r.id === config.guild.roles['Modérateur'])) askForBan = false

            const embeds = []

            if(askForBan) {
                embeds.push(new Embed()
                    .setColor('#9B59B6')
                    .setTitle('🔨 Demande de ban de ' + member.username)
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(member.id), inline: true },
                        { name: 'La sanction a été demandée par', value: userMention(interaction.user.id), inline: true },
                        { name: 'Raison', value: reason },
                        { name: 'Date de débannissement', value: new Date(date * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) }
                    ))

                const guildMember = interaction.guild.members.cache.get(member.id)
                await guildMember.roles.add(muteRole)

                try {
                    await member.send(`${bold('[BSFR]')}\n\nUne demande de bannissement à ton encontre est en attente pour la raison suivante :\n${inlineCode(reason)}\n\nTu as été temporairement mute le temps qu'une décision soit prise.`)
                } catch(error) {
                    embeds.push(new Embed()
                        .setColor('#E74C3C')
                        .setDescription('Le message n\'a pas pu être envoyé au membre'))
                }

                const banMessage = await adminChannel.send({ content: roleMention(config.guild.roles['Admin']), embeds: embeds })

                await ban.add(member.id, interaction.user.id, null, reason, date, adminChannel.id, banMessage.id)

                await banMessage.react('✅')
                await banMessage.react('❌')

                Logger.log('BanCommand', 'INFO', `${interaction.user.tag} a effectué une demande de bannissement à l'encontre de ${member.tag}`)
                await interaction.reply({ content: 'La demande de ban a bien été envoyée', ephemeral: true })
            } else {
                const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs)

                embeds.push(new Embed()
                    .setColor('#2ECC71')
                    .setTitle('🔨 Ban de ' + member.username)
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: 'Le vilain', value: userMention(member.id), inline: true },
                        { name: 'La sanction a été demandée par', value: userMention(interaction.user.id), inline: true },
                        { name: 'Raison', value: reason },
                        { name: 'Date de débannissement', value: new Date(date * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) }
                    ))

                await ban.add(member.id, interaction.user.id, interaction.user.id, reason, date)

                await logsChannel.send({ embeds: embeds })

                try {
                    await member.send({ content: `${bold('[BSFR]')}\n\nTu as été banni pour la raison suivante :\n${inlineCode(reason)}\n\nLorsque ton ban sera levé, tu recevras un message ici ou de la part du staff.` })
                } catch(error) {
                    Logger.log('BanCommand', 'ERROR', 'Le message n\'a pas pu être envoyé')
                }

                await interaction.guild.members.cache.get(member.id).ban({ days: 0, reason: reason })

                await interaction.reply({ content: `${userMention(member.id)} a été banni`, ephemeral: true })
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