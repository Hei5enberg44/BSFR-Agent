const dateFunction = require("../functions/Date")
const { getBanOrMuteOptions } = require("../functions/CommandsOptions")

class BanCommand {
    name = "ban"
    description = "Ban un utilisateur sur une période donnée"
    options = getBanOrMuteOptions()
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        let whoBanned       = interaction.member
        let bannedMember    = interaction.options._hoistedOptions[0].member
        let reason          = interaction.options._hoistedOptions[1].value
        let duration        = interaction.options._hoistedOptions[2].value

        // On récupère le temps
        let date = dateFunction.treatDuration(duration)

        if(!date) {
            this.utils.logger.log("[BanCommand] Invalid time: " + duration)
            return interaction.reply({content: "Temps invalide: " + duration, ephemeral: true});
        }

        const memberAlreadyBanned = await this.clients.mongo.find("pendings", {
            "type"      : "ban",
            "bannedId"  : bannedMember.user.id
        })

        if(memberAlreadyBanned.length > 0) {
            this.utils.logger.log("[BanCommand] A ban request against " + bannedMember.user.tag + " have been already made")
            return interaction.reply({content: "Il existe déjà une demande de ban à l'encontre de <@!" + bannedMember.user.id + ">", ephemeral: true});
        }

        let guild           = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        let adminChannel    = guild.channels.resolve(this.config.ids.channels.admin)
        let logsChannel     = guild.channels.resolve(this.config.ids.channels.logs)
        let muteRole        = guild.roles.cache.get(this.config.ids.roles.muted)

        if(whoBanned.roles.cache.some(r => ["modérateur", "Modérateur"].includes(r.name))) {
            let pendingMessage = this.utils.embed.embed().setTitle("🔨 Demande de ban de " + bannedMember.user.username)
                .setColor('#f07848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + bannedMember.user.id + "/" + bannedMember.user.avatar + ".png")
                .addField("Le vilain", "<@!" + bannedMember.user.id + ">", true)
                .addField("La sanction a été demandée par", "<@!" + whoBanned.user.id + ">", true)
                .addField("Raison", reason)
                .addField("Date de déban", date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

            pendingMessage = await adminChannel.send({content: "<@&" + this.config.ids.roles.admin +  ">", embeds: [pendingMessage]})

            const mongoUpdated = await this.clients.mongo.insert("pendings",{
                "type"                  : "ban",
                "pendingBanMessageId"   : pendingMessage.id,
                "bannedId"              : bannedMember.user.id,
                "bannerId"              : whoBanned.user.id,
                "banReason"             : reason,
                "unbanDate"             : date.getTime(),
            })

            await this.clients.mongo.insert("historical", {
                "type"      : "pendingBan",
                "messageId" : pendingMessage.id,
                "userId"    : bannedMember.user.id,
                "bannerId"  : whoBanned.user.id,
                "banReason" : reason,
                "unbanDate" : date.getTime(),
                "date"      : (new Date()).getTime()
            })

            if(mongoUpdated) {
                await pendingMessage.react("✅")
                await pendingMessage.react("❌")
                await bannedMember.roles.add(muteRole)

                await bannedMember.send("\n**[BSFR]**\n\nUne demande de bannissement à ton encontre est en attente pour la raison suivante: \n`" + reason + "`\n\nTu as été temporairement muté le temps qu'une décision soit prise.")

                this.utils.logger.log("[BanCommand] " + whoBanned.user.tag + " asked to ban " + bannedMember.user.tag)
                return interaction.reply({content: "La demande de ban a bien été envoyée", ephemeral: true});
            } else {
                this.utils.logger.log("[BanCommand] " + whoBanned.user.tag + " failed to ask to ban " + bannedMember.user.tag)
                return interaction.reply({content: "La demande de ban n'a pas pu être envoyée.", ephemeral: true});
            }
        } else {
            return interaction.reply(await this.ban(guild, bannedMember.user.id, reason, whoBanned.user.id, date))
        }
    }

    async ban(guild, bannedId, reason, bannerId, unbanDate, sendToLogs = true) {
        let bannedMember = guild.members.cache.get(bannedId)
        let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)

        const mongoUpdated = await this.clients.mongo.insertOrUpdate("users", { discordId: bannedMember.user.id }, {
            "bannerId"  : bannerId,
            "reason"    : reason,
            "unbanDate" : unbanDate.getTime(),
        })

        await this.clients.mongo.insert("historical", {
            "type"      : "ban",
            "bannerId"  : bannerId,
            "userId"    : bannedMember.user.id,
            "reason"    : reason,
            "unbanDate" : unbanDate.getTime(),
            "date"      : (new Date()).getTime()
        })

        if(mongoUpdated) {
            if(sendToLogs) {
                let logsMessage = this.utils.embed.embed().setTitle("🔨 Ban de " + bannedMember.user.username)
                    .setColor('#f07848')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + bannedMember.user.id + "/" + bannedMember.user.avatar + ".png")
                    .addField("Le vilain", "<@!" + bannedMember.user.id + ">", true)
                    .addField("La sanction a été prononcée par", "<@!" + bannerId + ">", true)
                    .addField("Raison", reason)
                    .addField("Date unban", unbanDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

                await logsChannel.send({embeds: [logsMessage]})
            }

            await bannedMember.send("\n**[BSFR]**\n\nTu as été banni pour la raison suivante: \n`" + reason + "`\n\nLorsque ton ban sera levé, tu recevras un message ici ou de la part d'un membre du staff.")

            await bannedMember.ban({days: 0, reason: reason})

            this.utils.logger.log("[BanCommand] " + bannedMember.user.tag + " has been banned")
            return {content: "<@!" + bannedMember.user.id + "> a bien été banni.", ephemeral: true}
        } else {
            this.utils.logger.log("[BanCommand] Ban hasn't been saved")
            return {content: "Impossible d'enregistrer le ban en base de données", ephemeral: true}
        }
    }
}

module.exports = BanCommand;