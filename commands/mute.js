import { CommandInteraction, ApplicationCommandOptionType, bold, inlineCode, userMention } from 'discord.js'
import Embed from '../utils/embed.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import mute from '../controllers/mute.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    data: {
        name: 'mute',
        description: 'Mute un membre sur une période définie',
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

            const isMuted = await mute.isMuted(member.id)
            if(isMuted) throw new CommandInteractionError(`${userMention(member.id)} est déjà mute`)

            const date = mute.getUnmuteDate(duration)

            if(!date) throw new CommandInteractionError('Durée invalide : ' + duration)

            const logsChannel = interaction.guild.channels.cache.get(config.guild.channels.logs)
            const muteRole = interaction.guild.roles.cache.get(config.guild.roles['Muted'])

            await mute.add(member.id, interaction.user.id, reason, date)

            const embeds = []

            embeds.push(new Embed()
                .setColor('#2ECC71')
                .setTitle('🔇 Mute de ' + member.username)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'Le vilain', value: userMention(member.id), inline: true },
                    { name: 'La sanction a été prononcée par', value: userMention(interaction.user.id), inline: true },
                    { name: 'Raison', value: reason },
                    { name: 'Date de démute', value: date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) }
                ))

            const guildMember = interaction.guild.members.cache.get(member.id)
            await guildMember.roles.add(muteRole)

            try {
                await member.send({ content: `${bold('[BSFR]')}\n\nTu as été mute pour la raison suivante :\n${inlineCode(reason)}\n\nTu seras unmute le ${date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}` })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }
            
            await logsChannel.send({ embeds: embeds })

            Logger.log('MuteCommand', 'INFO', `Le membre ${member.tag} a été mute par ${interaction.user.tag}`)

            await interaction.reply({ content: `${userMention(member.id)} a bien été mute`, ephemeral: true })
        } catch(error) {
            if(error instanceof CommandInteractionError) {
                throw new CommandError(error.message, interaction.commandName)
            } else {
                throw Error(error.message)
            }
        }
    }
}