const CronJob = require('cron').CronJob;

class TheCoolerBot {

    constructor() {

        // Déclaration de la configuration

        this.config = require("./config.json");

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            // Redis: require("./clients/RedisClient.js")
        };

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            // redis: new clients.Redis(this),
            // raw: {
            //     redis: clients.Redis
            // }
        };

        // Instanciation des reactions

        this.reactions = {
            Roles: new (require("./reactions/Roles.js")),
        }

        // Déclaration des utils

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            DiscordServer: new (require("./utils/DiscordServer.js"))({clients: this.clients})
        };

        // Instanciation et initialisation des Managers

        let managers = {
            Commands: require("./bot/CommandManager.js")
        };

        this.managers = {
            commands: new managers.Commands(this)
        };

        // Initialisation du bot

        this.init()
    }

    async init() {
        // On fait login le bot à la gateway de Discord.
        this.clients.discord.loginClient();

        this.clients.discord.getClient().on("ready", async () => {
            this.utils.Logger.log("Discord: Ready.");

            // On change l'activité du bot.
            await this.clients.discord.getClient().user.setActivity(this.config.discord.prefix + 'help - By Krixs', {
                type: "LISTENING"
            });

            await this.clients.discord.getClient().channels.cache.get("613064529676468267").messages.fetch();

            await this.clients.discord.getClient().guilds.cache.get("613063832994185232").members.fetch();

            // On démarre le CommandManager.
            this.managers.commands.init();
        });

        this.clients.discord.getClient().on('raw', packet => {
            let action = packet.t;
            let data = packet.d;
            let guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)

            if(action === "MESSAGE_REACTION_ADD" || action === "MESSAGE_REACTION_REMOVE"){
                let member = guild.members.cache.get(data.user_id)

                switch(data.message_id) {
                    case this.config.ids.message.country:
                        this.reactions.Roles.country(action, guild, member, this.config.ids.roles, data.emoji.name);
                }
            }
        })
    }

}

let Index = new TheCoolerBot();