import { SlashCommandBuilder, PermissionFlagsBits,CommandInteraction, userMention } from 'discord.js'
import { CommandError, CommandInteractionError } from '../utils/error.js'
import threads from '../controllers/threads.js'
import Locales from '../utils/locales.js'
import Logger from '../utils/logger.js'

export default {
    data: new SlashCommandBuilder()
        .setName('r')
        .setDescription('Replies to a private message')
        .setDescriptionLocalization('fr', 'Répond à un message privé')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Answer message')
                .setDescriptionLocalization('fr', 'Message de réponse')
                .setRequired(true)
        )
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    ,

    /**
     * Exécution de la commande
     * @param {CommandInteraction} interaction interaction Discord
     */
    async execute(interaction) {
        try {
            /** @type {string} */
            const message = interaction.options.getString('message')
            const thread = await threads.get('dm', interaction.channelId, null)

            if(!thread) throw new CommandInteractionError(Locales.get(interaction.locale, 'dm_wrong_channel_error'))

            const member = interaction.guild.members.cache.get(thread.memberId)

            if(member) {
                try {
                    await member.send({ content: `${userMention(interaction.user.id)}: ${message}` })
                    Logger.log('RCommand', 'INFO', `Message privé envoyé à ${member.user.tag}`)
                    await interaction.reply({ content: `${userMention(interaction.user.id)}: ${message}`, allowedMentions: { repliedUser: false } })
                } catch(error) {
                    Logger.log('RCommand', 'ERROR', `Le message privé à ${member.user.tag} n'a pas pu être envoyé`)
                    await interaction.reply({ content: Locales.get(interaction.locale, 'dm_not_sent', userMention(member.id)), ephemeral: true })
                }
            } else {
                Logger.log('RCommand', 'ERROR', `Impossible de récupérer le membre "${thread.memberId}"`)
                await interaction.reply({ content: Locales.get(interaction.locale, 'member_does_not_exist_error'), ephemeral: true })
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