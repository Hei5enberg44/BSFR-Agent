const { Client, MessageReaction, User, userMention, roleMention, bold, inlineCode } = require('discord.js')
const Embed = require('../utils/embed')
const { Bans, Reactions } = require('../controllers/database')
const { Op } = require('sequelize')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un ban dans la base de données
     * @param {String} memberId identifiant du membre
     * @param {String} bannedBy identifiant du membre réalisant la demante de ban
     * @param {String} approvedBy identifiant du membre approuvant la demante de ban
     * @param {String} reason raison du ban
     * @param {String|null} channelId channel où a été effectuée la demande de ban (facultatif)
     * @param {String|null} messageId identifiant du message correspondant à la demande de ban (facultatif)
     * @param {Number} date date d'unban
     */
    add: async function(memberId, bannedBy, approvedBy, reason, date, channelId = null, messageId = null) {
        const ban = await Bans.create({
            memberId: memberId,
            bannedBy: bannedBy,
            approvedBy: approvedBy,
            reason: reason,
            unbanDate: date
        })

        if(!approvedBy) {
            await Reactions.create({
                type: 'banRequest',
                data: {
                    banId: ban.id
                },
                memberId: bannedBy,
                channelId: channelId,
                messageId: messageId
            })
        }
    },

    /**
     * Approuve une demande de ban
     * @param {Number} banId identifiant du ban
     * @param {String} approvedBy identifiant du membre approuvant la demande de ban
     */
    approve: async function(banId, approvedBy) {
        await Bans.update({
            approvedBy: approvedBy
        }, {
            where: { id: banId }
        })
    },

    /**
     * Récupère les informations d'un ban par rapport à son identifiant
     * @param {Number} banId identifiant du ban
     * @returns {Promise<{id: Number, memberId: String, bannedBy: String, approvedBy: String, reason: String, unbanDate: Number}>} informations du ban
     */
    get: async function(banId) {
        const ban = await Bans.findOne({
            where: {
                id: banId
            }
        })

        return ban
    },

    /**
     * Récupère la liste des membres bannis
     * @returns {Promise<{id: Number, memberId: String, bannedBy: String, approvedBy: String, reason: String, unbanDate: Number}>} liste des membres bannis
     */
    list: async function() {
        const bans = await Bans.findAll({
            where: {
                unbanDate: {
                    [Op.lte]: Math.floor(new Date().getTime() / 1000)
                }
            }
        })

        return bans
    },

    /**
     * Supprime un ban de la base de donnée
     * @param {String} banId identifiant du ban
     */
    remove: async function(banId) {
        await Bans.destroy({
            where: {
                id: banId
            }
        })
    },

    /**
     * Test si un membre est banni
     * @param {String} memberId identifiant du membre
     * @returns {Promise<{id: Number, memberId: String, bannedBy: String, approvedBy: String, reason: String, unbanDate: Number}|null>} données concernant le ban
     */
    isBanned: async function(memberId) {
        const banned = await Bans.findOne({
            where: {
                memberId: memberId
            }
        })

        return banned
    },

    /**
     * Détermine la date d'unban en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param {String} duration durée du ban
     * @returns {Number} date de d'unban au format timestamp
     */
    getUnbanDate: function(duration) {
        const unit = duration.charAt(duration.length - 1).toUpperCase()
        const time = parseInt(duration.slice(0, -1))
        const date = new Date()
    
        switch(unit) {
            case "S":
                date.setSeconds(date.getSeconds() + time)
                break
            case "I":
                date.setSeconds(date.getSeconds() + (time * 60))
                break
            case "H":
                date.setSeconds(date.getSeconds() + (time * 60 * 60))
                break
            case "D":
                date.setSeconds(date.getSeconds() + (time * 24 * 60 * 60))
                break
            case "W":
                date.setSeconds(date.getSeconds() + (time * 7 * 24 * 60 * 60))
                break
            case "M":
                date.setSeconds(date.getSeconds() + (time * 30 * 24 * 60 * 60))
                break
            case "Y":
                date.setSeconds(date.getSeconds() + (time * 365 * 24 * 60 * 60))
                break
            default:
                return false
        }
    
        if(date.toString().toLowerCase() === "invalid date")
            return false
    
        return Math.floor(date.getTime() / 1000)
    },

    /**
	 * Ban d'un membre
	 * @param {MessageReaction} reaction The reaction object
	 * @param {User} user The user that applied the guild or reaction emoji
	 * @param {{id: Number, type: String, data: {banId: Number}, memberId: String, channelId: String, messageId: String, date: Date}} r données concernant la réaction
	 */
    ban: async function(reaction, user, r) {
		const banId = r.data.banId
		const banInfos = await module.exports.get(banId)

		const guild = reaction.client.guilds.cache.get(config.guild.id)
		const logsChannel = guild.channels.cache.get(config.guild.channels.logs)
		const muteRole = guild.roles.cache.get(config.guild.roles['Muted'])
		const member = guild.members.cache.get(banInfos.memberId)

		const embeds = []

		const embed = new Embed()
			.setThumbnail(member.displayAvatarURL({ dynamic: true }))
			.addFields(
                { name: 'Le vilain', value: userMention(banInfos.memberId) },
                { name: 'La sanction a été demandée par', value: userMention(banInfos.bannedBy) }
            )

		if(reaction.emoji.name === '✅') {
			embeds.push(embed.setColor('#2ECC71')
				.setTitle('🔨 [ACCEPTÉ] Demande de ban de ' + member.user.username)
				.addFields(
                    { name: 'La demande a été acceptée par', value: userMention(user.id), inline: true },
                    { name: 'Raison', value: banInfos.reason },
                    { name: 'Date de débannissement', value: new Date(banInfos.unbanDate * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) }
                ))

			await module.exports.approve(banId, user.id)
			await Reactions.destroy({ where: { id: r.id } })

			await logsChannel.send({ embeds: embeds })

			try {
                await member.send({ content: `${bold('[BSFR]')}\n\nTu as été banni pour la raison suivante :\n${inlineCode(banInfos.reason)}\n\nLorsque ton ban sera levé, tu recevras un message ici ou de la part du staff.` })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }

			await member.ban({ days: 0, reason: banInfos.reason })

			await reaction.message.reactions.removeAll()
			await reaction.message.edit({ embeds: embeds })

			Logger.log('BanCommand', 'INFO', `La demande de ban de ${member.user.tag} a été acceptée par ${user.tag}`)
		} else if(reaction.emoji.name === '❌') {
			embeds.push(embed.setColor('#2ECC71')
				.setTitle('🔨 [REFUSÉ] Demande de ban de ' + member.user.username)
				.addFields(
                    { name: 'La demande a été refusée par', value: userMention(user.id), inline: true },
                    { name: 'Raison', value: banInfos.reason },
                    { name: 'Date de débannissement', value: new Date(banInfos.unbanDate * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) },
                ))

			await member.roles.remove(muteRole)

			await module.exports.remove(banId)
			await Reactions.destroy({ where: { id: r.id } })

			await logsChannel.send({ embeds: embeds })

			try {
                await member.send({ content: `${bold('[BSFR]')}\n\nLa demande de bannissement n'a pas été approuvée.\nTu es désormais unmute.` })
            } catch(error) {
                embeds.push(new Embed()
                    .setColor('#E74C3C')
                    .setDescription('Le message n\'a pas pu être envoyé au membre'))
            }

			await reaction.message.reactions.removeAll()
			await reaction.message.edit({ embeds: embeds })

			Logger.log('BanCommand', 'INFO', `La demande de ban de ${member.user.tag} a été refusée par ${user.tag}`)
		}
	},

    /**
     * Deban les membres pour qui la date de fin de ban est passée
     * @param {Client} client client Discord
     */
    unban: async function(client) {
        const guild = client.guilds.cache.get(config.guild.id)
        const bans = await module.exports.list()

        for(const ban of bans) {
            const guildBan = await guild.bans.fetch(ban.memberId)

            if(guildBan) {
                // On envoie un message privé à l'utilisateur afin de le prévenir que son ban est levé
                // Si cela n'est pas possible, on envoie un message aux modérateur pour leur demander d'envoyer le lien d'invitation du serveur au membre
                try {
                    await guildBan.user.send({ content: `${bold('[BSFR]')}\n\nTu as été débanni.\nTâche d'être plus sage à l'avenir.\n\nVoici le lien d'invitation du serveur : ${config.links.discordInvite}` })
                } catch(error) {
                    const moderationChannel = guild.channels.cache.get(config.guild.channels.moderation)
                    await moderationChannel.send({ content: `${roleMention(config.guild.roles["Modérateur"])} - ${bold('Déban de')} ${userMention(guildBan.user.id)}\n\nImpossible d'envoyer le lien d'invitation automatiquement.\nMerci de réinviter l'utilisateur manuellement.\n\nLien d'invitation : ${config.links.discordInvite}` })
                }
            }

            await guild.members.unban(guildBan.user.id)
            await module.exports.remove(ban.id)

            Logger.log('Unban', 'INFO', `L'utilisateur ${guildBan.user.tag} a été débanni du serveur`)
        }
    }
}