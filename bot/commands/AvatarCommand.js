class AvatarCommand {
    name        = "avatar"
    description = "Récupére l'avatar d'un membre."
    options     = {
        "member": {
            "name"          : "membre",
            "type"          : "user",
            "description"   : "Membre",
            "required"      : false
        }
    }
    channels    = []

    constructor(opt) {
        this.utils      = opt.utils
        this.config     = opt.config
        this.clients    = opt.clients
    }

    async run(interaction) {
        // Target user or the member who made the command
        const user      = interaction.options._hoistedOptions[0]?.user ?? interaction.user
        const avatarUrl = user.displayAvatarURL({dynamic: true, size: 1024})

        await this.clients.mongo.insert("historical", {
            "type"      : "getAvatar",
            "userId"    : interaction.user.id,
            "avatarURL" : avatarUrl,
            "date"      : (new Date()).getTime()
        })

        return interaction.reply({content: avatarUrl})
    }
}

module.exports = AvatarCommand