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
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        if(this.config.ids.channels.agentDm !== interaction.channelId) {
            this.utils.logger.log("[DmCommand] Command executed in the wrong channel")
            return interaction.reply({content: "Merci d'effectuer cette commande dans <#" + this.config.ids.channels.agentDm + ">", ephemeral: true});
        }

        let member  = interaction.options._hoistedOptions[0].user
        let message = interaction.options._hoistedOptions[1].value

        const guild             = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
        const agentDmChannel    = guild.channels.resolve(this.config.ids.channels.agentDm)
        const adminMembers      = guild.roles.cache.get(this.config.ids.roles.admin).members
        const modoMembers       = guild.roles.cache.get(this.config.ids.roles.moderator).members
        const staffMembers      = adminMembers.concat(modoMembers)

        try {
            this.utils.logger.log("[DmCommand] Trying to send DM from " + interaction.user.tag + " to " + member.tag)
            await member.send({content: "<@!" + interaction.user.id + ">: " + message})
            this.utils.logger.log("[DmCommand] DM Sent")

            await this.clients.mongo.insert("historical", {
                "type"          : "dmSent",
                "userId"        : interaction.user.id,
                "receiverId"    : member.id,
                "message"       : message,
                "date"          : (new Date()).getTime()
            })

            const createdThread = await this.clients.mongo.find("threads", {type: "dm", userId: member.id})
            let thread = null

            if(createdThread.length === 0) {
                thread = await agentDmChannel.threads.create({
                    name: member.username,
                    autoArchiveDuration: 1440,
                    reason: 'DM de ' + member.username + "#" + member.discriminator
                });

                if(thread.id) {
                    this.utils.logger.log("[DmCommand] Thread successfully created")

                    for(const [, staffMember] of staffMembers) {
                        this.utils.logger.log("[DmCommand] Adding " + staffMember.user.tag + " to the new thread")
                        await thread.members.add(staffMember.user.id)
                    }

                    const mongoInserted = await this.clients.mongo.insert("threads", {type: "dm", threadId: thread.id, userId: member.id})

                    if(mongoInserted)
                        this.utils.logger.log("[DmCommand] Thread successfully inserted in DB")
                } else {
                    this.utils.logger.log("[DmCommand] Can't create thread")
                    agentDmChannel.send({content: "Can't create Thread"})
                }
            } else {
                thread = agentDmChannel.threads.cache.get(createdThread[0].threadId)

                if(thread.id)
                    this.utils.logger.log("[DmCommand Thread successfully found")
            }

            if(thread.id) {
                if(thread.archived) {
                    this.utils.logger.log("[DmCommand] Unarchiving Thread")
                    await thread.setArchived(false)
                }

                if(thread.locked) {
                    this.utils.logger.log("[DmCommand] Unlocking Thread")
                    await thread.setLocked(false)
                }

                thread.send({content: "<@!" + interaction.user.id + ">: " + message})
            }
            return interaction.reply({content: "Le DM à <@!" + member.id + "> a bien été envoyé !", ephemeral: false})
        } catch (e) {
            this.utils.logger.log("[DmCommand] Can't send DM: " + e)
            return interaction.reply({content: "Le DM à <@!" + member.id + "> n'a pas pu être envoyé", ephemeral: false})
        }
    }
}

module.exports = DmCommand;