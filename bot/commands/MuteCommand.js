const dateFunction = require("../functions/Date")
const { getBanOrMuteOptions } = require("../functions/CommandsOptions")

class MuteCommand {
    name = "mute"
    description = "Mute un utilisateur sur une période donnée"
    options = getBanOrMuteOptions()
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        let mutedMember = interaction.options._hoistedOptions[0].member
        let reason      = interaction.options._hoistedOptions[1].value
        let duration    = interaction.options._hoistedOptions[2].value

        const memberAlreadyMutted = await this.clients.mongo.find("users", {
            "discordId" : mutedMember.user.id,
            "unmuteDate": {$exists: true}
        })

        if(memberAlreadyMutted.length > 0) {
            this.utils.logger.log("[MuteCommand] " + mutedMember.user.tag + " is already muted")
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> est déjà mute", ephemeral: true});
        }

        // On récupère le temps
        let date = dateFunction.treatDuration(duration)

        if(!date) {
            this.utils.logger.log("[MuteCommand] Invalid time: " + duration)
            return interaction.reply({content: "Temps invalide: " + duration, ephemeral: true});
        }

        let guild       = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)
        let muteRole    = guild.roles.cache.get(this.config.ids.roles.muted)

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
                .addField("La sanction a été prononcé par", "<@!" + interaction.user.id + ">", true)
                .addField("Raison", reason)
                .addField("Date Unmute", date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }))

            await mutedMember.roles.add(muteRole)
            await logsChannel.send({embeds: [logsEmbed]})
            await mutedMember.send({ content: "\n**[BSFR]**\n\nTu as été muté pour la raison suivante: \n`" + reason + "`\n\nTu seras démuté le " + date.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) })

            this.utils.logger.log("[MuteCommand] " + mutedMember.user.tag + " has been muted by " + interaction.user.tag)
            return interaction.reply({content: "<@!" + mutedMember.user.id + "> a bien été mutée", ephemeral: true})
        } else {
            this.utils.logger.log("[MuteCommand] Mute hasn't been saved")
            return interaction.reply({content: "Impossible d'enregistrer le mute de <@!" + mutedMember.user.id + "> en base de données", ephemeral: true});
        }
    }
}

module.exports = MuteCommand;