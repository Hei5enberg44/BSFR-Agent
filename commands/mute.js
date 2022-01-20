const { MessageEmbed, CommandInteraction } = require('discord.js')
const { bold, inlineCode, userMention } = require('@discordjs/builders')
const { CommandError, CommandInteractionError } = require('../utils/error')
const mute = require('../controllers/mute')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'mute',
		description: 'Mute un membre sur une période définie',
        options: [
            {
                type: 'USER',
                name: 'membre',
                description: 'Membre',
                required: true
            },
            {
                type: 'STRING',
                name: 'raison',
                description: 'Raison',
                required: true
            },
            {
                type: 'STRING',
                name: 'durée',
                description: 'Durée (s = secondes / i = minutes / h = heures / d = jours / w = semaines / m = mois / y = année)',
                required: true
            }
        ],
        defaultPermission: false
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

            const isMuted = await mute.isMuted(member.id)
            if(isMuted) throw new CommandInteractionError(`${userMention(member.id)} est déjà muté`)

            const date = mute.getUnmuteDate(duration)

            if(!date) throw new CommandInteractionError('Durée invalide : ' + duration)

            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs)
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles['Muted'])

            await mute.add(member.id, interaction.user.id, reason, date)

            const embeds = []

            embeds.push(new MessageEmbed()
                .setColor('#2ECC71')
                .setTitle('🔇 Mute de ' + member.username)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addField('Le vilain', userMention(member.id), true)
                .addField('La sanction a été prononcée par', userMention(interaction.user.id), true)
                .addField('Raison', reason)
                .addField('Date de démute', new Date(date * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo }))

            const guildMember = interaction.guild.members.cache.get(member.id)
            await guildMember.roles.add(muteRole)

            try {
                await member.send({ content: `${bold('[BSFR]')}\n\nTu as été muté pour la raison suivante :\n${inlineCode(reason)}\n\nTu seras démuté le ${new Date(date * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}` })
            } catch(error) {
                embeds.push(new MessageEmbed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }
            
            await logsChannel.send({ embeds: embeds })

            Logger.log('MuteCommand', 'INFO', `Le membre ${member.tag} a été muté par ${interaction.user.tag}`)

            await interaction.reply({ content: `${userMention(member.id)} a bien été muté`, ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}