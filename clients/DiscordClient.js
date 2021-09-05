const { Client, Intents } = require("discord.js");

class DiscordClient {

    /**
     * Constructeur du DiscordClient
     */
    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils

        this.utils.logger.log("[DiscordClient] Creating new discord client")

        this.client = new Client({
            intents: [
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES
                // Intents.FLAGS.GUILD_PRESENCES,
            ],
            partials: [
                "CHANNEL"
            ]
        });
    }

    /**
     * Fonction de login pour discord.js
     */
    loginClient() {
        this.utils.logger.log("[DiscordClient] Logging in")

        this.client.login(this.config.discord.token);
    }

    /**
     * Getter pour le client.
     */
    getClient() {
        return this.client;
    }

}

module.exports = DiscordClient;