const { Client, MessageEmbed, GuildMember } = require('discord.js')
const { userMention, bold } = require('@discordjs/builders')
const { Mutes } = require('../controllers/database')
const { Op } = require('sequelize')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Ajoute un mute dans la base de données
     * @param {String} memberId identifiant du membre
     * @param {String} mutedBy identifiant du membre réalisant la demante de mute
     * @param {String} reason raison du mute
     * @param {Number} date date d'unmute
     */
    add: async function(memberId, mutedBy, reason, date) {
        await Mutes.create({
            memberId: memberId,
            mutedBy: mutedBy,
            reason: reason,
            unmuteDate: date
        })
    },

    /**
     * Supprime un mute de la base de donnée
     * @param {String} memberId identifiant du membre
     */
    remove: async function(memberId) {
        await Mutes.destroy({
            where: {
                memberId: memberId
            }
        })
    },

    /**
     * Test si un membre est muted
     * @param {String} memberId identifiant du membre
     * @returns {Promise<{id: Number, memberId: String, mutedBy: String, reason: String, unmuteDate: Number}|null>} données concernant le mute
     */
    isMuted: async function(memberId) {
        const muted = await Mutes.findOne({
            where: {
                memberId: memberId
            }
        })

        return muted
    },

    /**
     * Détermine la date d'unmute en fonction du choix réalisé par l'Administrateur ou le Modérateur
     * @param {String} duration durée du mute
     * @returns {Number} date de d'unmute au format timestamp
     */
    getUnmuteDate: function(duration) {
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
     * Si le membre avait été muté avant son départ et que le mute n'est pas terminé, on le mute à nouveau
     * @param {GuildMember} member The member that has joined a guild
     */
    remute: async function(member) {
        const isMuted = await module.exports.isMuted(member.user.id)
        const date = Math.floor(new Date().getTime() / 1000)

        if(isMuted && isMuted.unmuteDate > date) {
            const logsChannel = member.guild.channels.cache.get(config.guild.channels.logs)
            const muteRole = member.guild.roles.cache.get(config.guild.roles.Muted)

            const embed = new MessageEmbed()
                .setColor('#2ECC71')
                .setTitle('🔇 Re mute de ' + member.user.username)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addField('Le vilain', userMention(isMuted.memberId))
                .addField('La sanction a été prononcée par', userMention(isMuted.mutedBy))
                .addField('Raison', isMuted.reason)
                .addField('Date de démute', new Date(isMuted.unmuteDate * 1000).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))
                .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })

            await member.roles.add(muteRole)
            await logsChannel.send({ embeds: [embed] })

            Logger.log('Mute', 'INFO', `Le membre ${member.user.tag} est toujours muté`)
        }
    },

    /**
     * Démute un membre
     * @param {Client} client client Discord
     */
    unmute: async function(client) {
        const guild = client.guilds.cache.find(g => g.id === config.guild.id)
        const logsChannel = guild.channels.cache.get(config.guild.channels.logs)
        const muteRole = guild.roles.cache.get(config.guild.roles.Muted)

        const date = Math.floor(new Date().getTime() / 1000)

        const mutedMembers = await Mutes.findAll({
            where: {
                unmuteDate: { [Op.lte]: date }
            }
        })

        for(const mutedMember of mutedMembers) {
            const embeds = []
            const memberToUnmute = guild.members.cache.get(mutedMember.memberId)

            await module.exports.remove(mutedMember.memberId)

            if(memberToUnmute) {
                embeds.push(new MessageEmbed()
                    .setColor('#2ECC71')
                    .setTitle('🔇 Unmute de ' + memberToUnmute.user.username)
                    .setThumbnail(memberToUnmute.displayAvatarURL({ dynamic: true }))
                    .addField('Le vilain', userMention(mutedMember.memberId), true)
                    .addField('Prononcée par', userMention(mutedMember.mutedBy), true)
                    .addField('Raison', mutedMember.reason)
                    .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo }))
    
                await memberToUnmute.roles.remove(muteRole)
    
                try {
                    await memberToUnmute.send({ content: `${bold('[BSFR]')}\n\nTu as été démuté.` })
                } catch(error) {
                    embeds.push(new MessageEmbed()
                        .setColor('#E74C3C')
                        .setDescription('Le message n\'a pas pu être envoyé au membre'))
                }

                Logger.log('UnmuteCommand', 'INFO', `Le membre ${memberToUnmute.user.tag} a été démuté`)
            } else {
                embeds.push(new MessageEmbed()
                    .setColor('#E74C3C')
                    .setTitle('🔇 Unmute de ' + mutedMember.memberId)
                    .setDescription('Le membre n\'est plus présent sur le discord')
                    .addField('Le vilain', userMention(mutedMember.memberId), true)
                    .addField('La sanction avait été prononcée par', userMention(mutedMember.mutedBy))
                    .addField('Raison', mutedMember.reason)
                    .setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo }))

                Logger.log('UnmuteCommand', 'INFO', `Le membre "${mutedMember.memberId}" n'a pas été démuté car celui-ci n'est plus présent sur le serveur`)
            }

            await logsChannel.send({ embeds: embeds })
        }
    }
}