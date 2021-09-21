class UnmuteCommand {
    name = "unmute"
    description = "Unmute un utilisateur"
    options = {
        "member": {
            "name": "membre",
            "type": "user",
            "description": "Membre",
            "required": true
        },
        "reason": {
            "name": "raison",
            "type": "string",
            "description": "Raison",
            "required": true
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        let mutedMember = interaction.options._hoistedOptions[0].member
        let reason      = interaction.options._hoistedOptions[1].value

        const usersToUnmute = await this.clients.mongo.find("users", { discordId: mutedMember.user.id, unmuteDate: {$exists: true} })

        if(usersToUnmute.length > 0) {
            this.utils.logger.log("[UnmuteCommand] Unmutting " + mutedMember.user.tag)

            await this.clients.mongo.insert("historical", {
                "type"          : "manualUnmute",
                "userId"        : usersToUnmute[0].discordId,
                "date"          : usersToUnmute[0].unmuteDate,
                "reason"        : usersToUnmute[0].muteReason,
                "muterId"       : usersToUnmute[0].muterId,
                "unmuterId"     : interaction.user.id,
                "unmuteReason"  : reason
            })

            await this.clients.mongo.update("users", { "_id": usersToUnmute[0]._id }, { $unset: {
                    "unmuteDate"    : 1,
                    "muteReason"    : 1,
                    "muterId"       : 1
            }})

            const guild         = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
            const muteRole      = guild.roles.cache.get(this.config.ids.roles.muted)
            const logsChannel   = guild.channels.cache.get(this.config.ids.channels.logs)

            await mutedMember.roles.remove(muteRole)

            try {
                await mutedMember.send({content: "**[BSFR]**\n\nTu as été démuté."})
            } catch (e) {
                this.utils.logger.log("[UnmuteCommand] Message can't be sent to user")
            }

            let logsMessage = this.utils.embed.embed().setTitle("🔇 Unmute manuel de " + mutedMember.user.username)
                .setColor('#1b427c')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedMember.user.id + "/" + mutedMember.user.avatar + ".png")
                .addField("Le vilain", "<@!" + mutedMember.user.id + ">", true)
                .addField("Prononcée par", "<@!" + usersToUnmute[0].muterId + ">", true)
                .addField("Levée par", "<@!" + interaction.user.id + ">", true)
                .addField("Raison mute", usersToUnmute[0].muteReason, true)
                .addField("Raison unmute", reason, true)
                .addField("Date unmute de base", (new Date(usersToUnmute[0].unmuteDate)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

            await logsChannel.send({embeds: [logsMessage]})

            this.utils.logger.log("[UnmuteCommand] " + mutedMember.user.tag + " has been unmuted by " + interaction.user.tag)
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> a été démuté.", ephemeral: true})
        } else {
            this.utils.logger.log("[UnmuteCommand] " + mutedMember.user.tag + " is not muted")
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> n'est pas muté.", ephemeral: true})
        }
    }
}

module.exports = UnmuteCommand