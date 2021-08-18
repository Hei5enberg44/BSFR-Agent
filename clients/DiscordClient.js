const { Client, Intents, Options } = require("discord.js");

class DiscordClient {

    /**
     * Constructeur du DiscordClient
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                // Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
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
        this.client.login(this.config.discord.token);
    }

    /**
     * Getter pour le client.
     * @returns {Client | module:"discord.js".Client}
     */
    getClient() {
        return this.client;
    }

}

module.exports = DiscordClient;