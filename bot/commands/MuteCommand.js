const dateFunction = require("../functions/Date")
const { getBanOrMuteOptions } = require("../functions/CommandsOptions")

class MuteCommand {
    name        = "mute"
    description = "Mute un utilisateur sur une période définie."
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
        const mutedMember = interaction.options._hoistedOptions[0].member
        const reason      = interaction.options._hoistedOptions[1].value
        const duration    = interaction.options._hoistedOptions[2].value

        const memberAlreadyMuted = await this.clients.mongo.find("users", {
            "discordId" : mutedMember.user.id,
            "unmuteDate": {$exists: true}
        })

        // Check if the member is not already muted
        if(memberAlreadyMuted.length > 0) {
            this.utils.logger.log("[MuteCommand] " + mutedMember.user.tag + " is already muted")
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> est déjà muté.", ephemeral: true});
        }

        // Get unmute date
        let date = dateFunction.treatDuration(duration)

        // If the date is invalid
        if(!date) {
            this.utils.logger.log("[MuteCommand] Invalid time: " + duration)
            return interaction.reply({content: "Temps invalide : " + duration, ephemeral: true});
        }

        const logsChannel = this.guild.channels.resolve(this.config.ids.channels.logs)
        const muteRole    = this.guild.roles.cache.get(this.config.ids.roles.muted)

        const mongoUpdated = await this.clients.mongo.insertOrUpdate("users", { discordId: mutedMember.user.id }, {
            "unmuteDate": date.getTime(),
            "muteReason": reason,
            "muterId"   : interaction.user.id
        })

        await this.clients.mongo.insert("historical", {
            "type"      : "mute",
            "userId"    : mutedMember.user.id,
            "unmuteDate": date.getTime(),
            "muteReason": reason,
            "muterId"   : interaction.user.id,
            "date"      : (new Date()).getTime()
        })

        if(mongoUpdated) {
            this.utils.logger.log("[MuteCommand] Mute has been saved")
            let logsEmbed = this.utils.embed.embed().setTitle("🔇 Mute de " + mutedMember.user.username)
                .setColor('#4886f0')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedMember.user.id + "/" + mutedMember.user.avatar + ".png")
                .addField("Le vilain", "<@!" + mutedMember.user.id + ">", true)
                .addField("La sanction a été prononcée par", "<@!" + interaction.user.id + ">", true)
                .addField("Raison", reason)
                .addField("Date de démute", date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

            await mutedMember.roles.add(muteRole)

            // Send in logs and into muted member DM
            await logsChannel.send({embeds: [logsEmbed]})
            await mutedMember.send({ content: "\n**[BSFR]**\n\nTu as été muté pour la raison suivante : \n`" + reason + "`\n\nTu seras démuté le " + date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) })

            this.utils.logger.log("[MuteCommand] " + mutedMember.user.tag + " has been muted by " + interaction.user.tag)
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> a bien été muté.", ephemeral: true})
        } else {
            this.utils.logger.log("[MuteCommand] Mute hasn't been saved")
            return interaction.reply({content: "Impossible d'enregistrer le mute de <@!" + mutedMember.user.id + "> en base de données.", ephemeral: true});
        }
    }
}

module.exports = MuteCommand;