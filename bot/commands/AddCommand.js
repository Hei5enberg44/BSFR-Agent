const { addBannedWord } = require("../functions/BannedWords");
const { addBirthdayMessage } = require("../functions/BirthdayMessage");
const { getAddOrRemoveOptions } = require("../functions/CommandsOptions");

class AddCommand {
    name        = "add"
    description = "Ajout divers"
    options     = getAddOrRemoveOptions(true)
    roles       = ["Admin", "Modérateur"]
    channels    = ["agentCommands"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
        this.config     = opt.config
        this.guild      = opt.guild
    }

    async run(interaction) {
        const subject = interaction.options._hoistedOptions[0].value

        this.utils.logger.log("[AddCommand] Subject selected: " + subject)

        const logsChannel = this.guild.channels.cache.get(this.config.ids.channels.logs)

        let embed = null

        switch (subject) {
            case "bannedWords":
                const results = await addBannedWord(interaction.options._hoistedOptions[1].value, interaction.user, this)

                embed = this.utils.embed.embed().setTitle("⛔ Ajout de mots bannis")
                    .setColor('#F04848')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")
                    .addField("Utilisateur", interaction.user.tag)

                // For every new banned words
                for (const index in results) {
                    await embed.addField(index.replace("_", " "), results[index])
                }

                break
            case "birthdayMessages":
                const result = await addBirthdayMessage(interaction.options._hoistedOptions[1].value, interaction.user, this)

                embed = this.utils.embed.embed().setTitle("🥳 Ajout d'une phrase d'anniversaire")
                    .setColor('#48f050')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + interaction.user.id + "/" + interaction.user.avatar + ".png")
                    .addField("Utilisateur", interaction.user.tag)
                    .addField(result, interaction.options._hoistedOptions[1].value)

                break
        }

        await logsChannel.send({embeds: [embed]})

        return interaction.reply({embeds: [embed]})
    }
}

module.exports = AddCommand;