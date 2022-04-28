const { CommandInteraction } = require('discord.js')
const { bold, userMention } = require('@discordjs/builders')
const Embed = require('../utils/embed')
const { CommandError, CommandInteractionError } = require('../utils/error')
const mute = require('../controllers/mute')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
	data: {
		name: 'unmute',
		description: 'Démute un membre',
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

            const isMuted = await mute.isMuted(member.id)
            if(!isMuted) throw new CommandInteractionError(`${userMention(member.id)} n'est pas mute`)

            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs)
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles.Muted)

            await mute.remove(member.id)

            const embeds = []

            embeds.push(new Embed()
                .setColor('#2ECC71')
                .setTitle('🔇 Unmute manuel de ' + member.username)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addField('Le vilain', userMention(member.id), true)
                .addField('Prononcée par', userMention(isMuted.mutedBy), true)
                .addField('Levée par', userMention(interaction.user.id), true)
                .addField('Raison unmute', reason, true)
                .addField('Date de démute initiale', new Date(isMuted.unmuteDate * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })))

            const guildMember = interaction.guild.members.cache.get(member.id)
            await guildMember.roles.remove(muteRole)

            try {
                await member.send({ content: `${bold('[BSFR]')}\n\nTu as été unmute.` })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }

            await logsChannel.send({ embeds: embeds })

            Logger.log('MuteCommand', 'INFO', `Le membre ${member.tag} a été unmute par ${interaction.user.tag}`)

            await interaction.reply({ content: `${userMention(member.id)} a bien été unmute`, ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
	}
}