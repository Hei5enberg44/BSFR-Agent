class RCommand {
    name = "r"
    description = "Répond à un DM"
    options = {
        "message": {
            "name": "message",
            "type": "string",
            "description": "Message",
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
        const guild     = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const thread    = await this.clients.mongo.find("threads", {type: "dm", threadId: interaction.channelId})

        if(thread.length === 0) {
            this.utils.logger.log("[RCommand] Command not executed in a DM Thread")
            return interaction.reply({content: "Merci d'effectuer cette commande dans un thread DM", ephemeral: true});
        }

        const member    = guild.members.cache.get(thread[0].userId)
        const message   = interaction.options._hoistedOptions[0].value

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

                return interaction.reply({content: "Le DM à <@!" + member.id + "> a bien été envoyé !", ephemeral: false})
            } catch (e) {
                this.utils.logger.log("[RCommand] Can't send DM: " + e)
                return interaction.reply({content: "Le DM à <@!" + member.id + "> n'a pas pu être envoyé", ephemeral: false})
            }
        } else {
            this.utils.logger.log("[RCommand] Can't get user")
            return interaction.reply({content: "Impossible de récupérer l'utilisateur"});
        }
    }
}

module.exports = RCommand;