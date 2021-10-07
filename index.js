class TheCoolerBot {

    constructor() {
        // Déclaration de la configuration
        this.config     = require("./config.json")

        // Déclaration des utils
        this.utils      = {
            logger  : new (require("./utils/Logger.js")),
            embed   : new (require("./utils/Embed.js"))
        };

        // Instanciation et initialisation des clients
        this.clients    = {
            discord : new (require("./clients/DiscordClient.js"))(this),
            mongo   : new (require("./clients/MongodbClient.js"))(this),
            twitter : new (require("./clients/TwitterClient.js"))(this),
            twitch  : new (require("./clients/TwitchClient.js"))(this)
        };

        // Instanciation et initialisation des managers
        this.managers   = {
            commands    : new (require("./bot/CommandManager.js"))(this),
            listeners   : new (require("./bot/ListenManager.js"))(this),
            autoactions : new (require("./bot/AutoActionsManager.js"))(this)
        };

        // Initialisation du bot
        this.init()
    }

    async init() {
        let isBotStarted = false

        this.utils.logger.log("[Main] Starting Bot")
        // On fait login le bot à la gateway de Discord.
        this.clients.discord.loginClient()

        // Connection à MongoDB
        await this.clients.mongo.connect()

        // Quand la connexion avec discord est prête
        this.clients.discord.getClient().on("ready", async () => {
            this.utils.logger.log("[DiscordClient] Ready")

            this.utils.logger.log("[DiscordClient] Fetching Guild Members");
            const guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)

            await guild.members.fetch()
            await guild.channels.fetch()

            // On change l'activité du bot.
            this.clients.discord.getClient().user.setActivity('By Krixs', {
                type: "LISTENING"
            })

            // On démarre le CommandManager.
            await this.managers.commands.init(guild)
            await this.managers.listeners.init(guild)
            await this.managers.autoactions.init(guild)

            isBotStarted = true
            this.utils.logger.log("[Main] Bot Started")
        })

        this.clients.discord.getClient().on("raw", async packet => {
            if(isBotStarted)
                await this.managers.listeners.listen(packet)
        })
    }
}

new TheCoolerBot()