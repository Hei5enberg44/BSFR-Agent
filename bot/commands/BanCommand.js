const dateFunction = require("../functions/Date")
const { getBanOrMuteOptions } = require("../functions/CommandsOptions")

class BanCommand {
    name        = "ban"
    description = "Bannit un utilisateur sur une période donnée."
    options     = getBanOrMuteOptions()
    roles       = ["Admin", "Modérateur"]
    channels    = []

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
        this.guild      = opt.guild
    }

    async run(interaction) {
        const whoBanned       = interaction.member
        const bannedMember    = interaction.options._hoistedOptions[0].member
        const reason          = interaction.options._hoistedOptions[1].value
        const duration        = interaction.options._hoistedOptions[2].value

        // Get unban date
        const date = dateFunction.treatDuration(duration)

        // If the date is invalid
        if(!date) {
            this.utils.logger.log("[BanCommand] Invalid time: " + duration)
            return interaction.reply({content: "Temps invalide : " + duration, ephemeral: true});
        }

        const memberAlreadyBanned = await this.clients.mongo.find("pendings", {
            "type"      : "ban",
            "bannedId"  : bannedMember.user.id
        })

        // Check if the member to ban doesn't have a current waiting pending ban
        if(memberAlreadyBanned.length > 0) {
            this.utils.logger.log("[BanCommand] A ban request against " + bannedMember.user.tag + " have been already made")
            return interaction.reply({content: "Il existe déjà une demande de ban à l'encontre de <@!" + bannedMember.user.id + ">", ephemeral: true});
        }

        const adminChannel  = this.guild.channels.resolve(this.config.ids.channels.admin)
        const muteRole      = this.guild.roles.cache.get(this.config.ids.roles.muted)

        let askForBan = false

        // Check if the user have the admin or moderator role (admin > moderator)
        for(const[, role] of whoBanned.roles.cache.entries()) {
            if(["modérateur", "Modérateur"].includes(role.name))
                askForBan = true

            if(["admin", "Admin"].includes(role.name)) {
                askForBan = false
                break
            }
        }

        // If the user is a moderator, the ban need a validation by at least one admin
        if(askForBan) {
            const pendingEmbed = this.utils.embed.embed().setTitle("🔨 Demande de ban de " + bannedMember.user.username)
                .setColor('#f07848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + bannedMember.user.id + "/" + bannedMember.user.avatar + ".png")
                .addField("Le vilain", "<@!" + bannedMember.user.id + ">", true)
                .addField("La sanction a été demandée par", "<@!" + whoBanned.user.id + ">", true)
                .addField("Raison", reason)
                .addField("Date de débannissement", date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

            const pendingMessage = await adminChannel.send({content: "<@&" + this.config.ids.roles.admin +  ">", embeds: [pendingEmbed]})

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

                await bannedMember.send("\n**[BSFR]**\n\nUne demande de bannissement à ton encontre est en attente pour la raison suivante : \n`" + reason + "`\n\nTu as été temporairement muté le temps qu'une décision soit prise.")

                this.utils.logger.log("[BanCommand] " + whoBanned.user.tag + " asked to ban " + bannedMember.user.tag)
                return interaction.reply({content: "La demande de ban a bien été envoyée.", ephemeral: true});
            } else {
                this.utils.logger.log("[BanCommand] " + whoBanned.user.tag + " failed to ask to ban " + bannedMember.user.tag)
                return interaction.reply({content: "La demande de ban n'a pas pu être envoyée.", ephemeral: true});
            }
        } else {
            return interaction.reply(await this.ban(bannedMember.user.id, reason, whoBanned.user.id, date))
        }
    }

    async ban(bannedId, reason, bannerId, unbanDate, sendToLogs = true) {
        const bannedMember  = this.guild.members.cache.get(bannedId)
        const logsChannel   = this.guild.channels.resolve(this.config.ids.channels.logs)

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
                    .addField("Date débannissement", unbanDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

                await logsChannel.send({embeds: [logsMessage]})
            }

            // Sending a DM to the banned member (before his ban)
            await bannedMember.send("\n**[BSFR]**\n\nTu as été banni pour la raison suivante : \n`" + reason + "`\n\nLorsque ton ban sera levé, tu recevras un message ici ou de la part du staff.")

            await bannedMember.ban({days: 0, reason: reason})

            this.utils.logger.log("[BanCommand] " + bannedMember.user.tag + " has been banned")
            return {content: "<@!" + bannedMember.user.id + "> a été banni.", ephemeral: true}
        } else {
            this.utils.logger.log("[BanCommand] Ban hasn't been saved")
            return {content: "Impossible d'enregistrer le bannissement en base de données.", ephemeral: true}
        }
    }
}

module.exports = BanCommand;