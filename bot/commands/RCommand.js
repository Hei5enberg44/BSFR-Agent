class RCommand {
    name        = "r"
    description = "Répond à un message privé."
    options     = {
        "message": {
            "name"          : "message",
            "type"          : "string",
            "description"   : "Message",
            "required"      : true
        }
    }
    roles       = ["Admin", "Modérateur"]
    channels    = []

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
        this.guild      = opt.guild
    }

    async run(interaction) {
        const thread    = await this.clients.mongo.find("threads", {type: "dm", threadId: interaction.channelId})

        // If the command was not executed in a DM thread
        if(thread.length === 0) {
            this.utils.logger.log("[RCommand] Command not executed in a DM Thread")
            return interaction.reply({content: "Merci d'effectuer cette commande dans un thread de message privé.", ephemeral: true});
        }

        const member    = this.guild.members.cache.get(thread[0].userId)
        const message   = interaction.options._hoistedOptions[0].value

        // If the member is still on the server
        if(member) {
            try {
                this.utils.logger.log("[RCommand] Trying to send DM from " + interaction.user.tag + " to " + member.user.tag)

                await member.send({content: "<@!" + interaction.user.id + ">: " + message})

                this.utils.logger.log("[RCommand] DM Sent")

                await this.clients.mongo.insert("historical", {
                    "type"          : "dmSent",
                    "userId"        : interaction.user.id,
                    "receiverId"    : member.id,
                    "message"       : message,
                    "date"          : (new Date()).getTime()
                })

                return interaction.reply({content: "<@!" + interaction.user.id + ">: " + message, ephemeral: false})
            } catch (e) {
                this.utils.logger.log("[RCommand] Can't send DM: " + e)
                return interaction.reply({content: "Le message privé à <@!" + member.id + "> n'a pas pu être envoyé.", ephemeral: false})
            }
        } else {
            this.utils.logger.log("[RCommand] Can't get user")
            return interaction.reply({content: "Impossible de récupérer l'utilisateur."});
        }
    }
}

module.exports = RCommand;