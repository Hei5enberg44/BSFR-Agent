class TheCoolerBot {

    constructor() {
        // Déclaration de la configuration
        this.config     = require("./config.json");

        // Déclaration des utils
        this.utils      = {
            logger  : new (require("./utils/Logger.js")),
            embed   : new (require("./utils/Embed.js"))
        };

        // Instanciation et initialisation des clients
        let clients     = {
            discord : require("./clients/DiscordClient.js"),
            mongo   : require("./clients/MongodbClient.js")
        };
        this.clients    = {
            discord : new clients.discord(this),
            mongo   : new clients.mongo(this)
        };

        // Instanciation et initialisation des managers
        let managers    = {
            commands: require("./bot/CommandManager.js")
        };
        this.managers   = {
            commands: new managers.commands(this)
        };

        // Initialisation du bot
        this.init()
    }

    async init() {
        this.utils.logger.log("[Main] Starting Bot");
        // On fait login le bot à la gateway de Discord.
        this.clients.discord.loginClient();

        // Connection à MongoDB
        await this.clients.mongo.connect()

        // Quand la connexion avec discord est prête
        this.clients.discord.getClient().on("ready", async () => {
            this.utils.logger.log("[DiscordClient] Ready");

            // On change l'activité du bot.
            await this.clients.discord.getClient().user.setActivity('By Krixs', {
                type: "LISTENING"
            });

            // On démarre le CommandManager.
            await this.managers.commands.init();

            this.utils.logger.log("[Main] Bot Started");
        });
    }
}

let Index = new TheCoolerBot();