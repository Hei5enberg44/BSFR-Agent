const { getAllBannedWord } = require("../functions/BannedWords");
const { getAllBirthdayMessage } = require("../functions/BirthdayMessage");
const {getAddOrRemoveOptions} = require("../functions/CommandsOptions");

class RemoveCommand {
    name = "remove"
    description = "Suppression diverse"
    options = getAddOrRemoveOptions()
    roles = ["Admin", "Modérateur"]
    channels = ["agentCommands"]

    constructor(opt) {
        this.utils      = opt.utils
        this.clients    = opt.clients
    }

    async run(interaction) {
        const subject   = interaction.options._hoistedOptions[0].value
        const ids       = interaction.options._hoistedOptions[1].value.replace(" ", "").split(";")

        let datas, key = null
        let title = null

        switch (subject) {
            case "bannedWords":
                datas = await getAllBannedWord(interaction.user, this)
                key = "word"
                title = "mots bannis"
                break;
            case "birthdayMessages":
                datas = await getAllBirthdayMessage(interaction.user, this)
                key = "message"
                title = "messages d'anniversaire"
                break;
        }

        let dataToRemove = []
        let objectIds = []

        // For each data to delete, we are creating 2 array. One to display to the user (for validation), One to store db object_id
        for(const [index, data] of datas.entries()) {
            if(ids.includes(index.toString())) {
                dataToRemove.push(index + " - " + data[key])
                objectIds.push(data._id)
            }
        }

        // If there is nothing to delete
        if(dataToRemove.length === 0)
            return interaction.reply({content: "Les IDs renseignés n'existent pas.", ephemeral: true})

        let embed = this.utils.embed.embed().setTitle("🗑️ Confirmation de la suppression de " + title)
            .setThumbnail(interaction.user.displayAvatarURL({dynamic: true, size: 1024}))
            .setDescription("Êtes-vous sûr de vouloir supprimer les données suivantes ?")
            .addField("Données", dataToRemove.join("\n"))

        const reply = await interaction.reply({embeds: [embed], fetchReply: true})

        const mongoUpdated = await this.clients.mongo.insert("pendings",{
            "type"      : "remove",
            "subType"   : subject,
            "ids"       : objectIds,
            "removed"   : dataToRemove,
            "messageId" : reply.id,
            "channelId" : interaction.channelId,
        })

        await this.clients.mongo.insert("historical", {
            "type"      : "pendingRemove",
            "subType"   : subject,
            "userId"    : interaction.user.id,
            "ids"       : objectIds,
            "removed"   : dataToRemove,
            "messageId" : reply.id,
            "channelId" : interaction.channelId,
            "date"      : (new Date()).getTime()
        })

        if(mongoUpdated) {
            await reply.react("✅")
            await reply.react("❌")
            this.utils.logger.log("[RemoveCommand] Pending remove has been saved")
        } else {
            await reply.editReply({content: "Une erreur est survenue lors de l'enregistrement en base de données."})
            this.utils.logger.log("[RemoveCommand] An error occured while saving pending remove")
        }
    }
}

module.exports = RemoveCommand;