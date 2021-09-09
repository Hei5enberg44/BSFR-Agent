class DmCommand {
    name = "dm"
    description = "Envoie un message en DM à un membre via l'agent"
    options = {
        "member": {
            "name": "membre",
            "type": "user",
            "description": "Membre",
            "required": true
        },
        "message": {
            "name": "message",
            "type": "string",
            "description": "Message",
            "required": true
        }
    }
    roles = ["Admin", "Modérateur"]

    constructor(opt) {
        this.utils  = opt.utils
        this.config = opt.config
    }

    async run(interaction) {
        if(this.config.ids.channels.agentDm !== interaction.channelId) {
            this.utils.logger.log("[DmCommand] Command executed in the wrong channel")
            return interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.agentDm + ">", ephemeral: true});
        }

        let member  = interaction.options._hoistedOptions[0].user
        let message = interaction.options._hoistedOptions[1].value

        try {
            this.utils.logger.log("[DmCommand] Trying to send DM from " + interaction.user.username + "#" + interaction.user.discriminator + " to " + member.username + "#" + member.discriminator)
            await member.send({content: "<@!" + interaction.user.id + ">: " + message})
            this.utils.logger.log("[DmCommand] DM Sent")
            return interaction.reply({content: "Le DM à <@!" + member.id + "> a bien été envoyé !", ephemeral: false})
        } catch (e) {
            this.utils.logger.log("[DmCommand] Can't send DM: " + e)
            return interaction.reply({content: "Le DM à " + member.username + "#" + member.discriminator + " n'a pas pu être envoyé", ephemeral: false})
        }
    }
}

module.exports = DmCommand;