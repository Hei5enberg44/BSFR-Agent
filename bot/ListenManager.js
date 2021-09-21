const fs = require("fs");

class ListenManager {
    constructor(opt) {
        this.clients        = opt.clients;
        this.utils          = opt.utils;
        this.config         = opt.config;
        this.opt            = opt;
        this.listeners      = {}
        this.bannedWords    = {}
    }

    async init() {
        this.utils.logger.log("[ListenManager] Initialisation")

        // On "scan" le dossier des commandes et on ajoute les commandes.
        fs.readdirSync("./bot/listeners/").forEach(file => {
            let listen = new (require("./listeners/" + file))(this.opt)

            this.utils.logger.log("[ListenManager] Find '" + listen.name + "'")

            this.listeners[listen.name] = listen
        })
    }

    async listen(packet) {
        const action    = packet.t;
        const data      = packet.d;

        if(data !== null && data.guild_id === this.config.discord.guildId) {
            switch(action) {
                case "MESSAGE_REACTION_ADD":
                    this.listeners["ValidationBan"].listen(data)
                    break;
                case "MESSAGE_CREATE":
                    this.listeners["DM"].listen(data)
                    this.listeners["BannedWords"].listen(data)
                    this.listeners["FileScan"].listen(data)
                    break;
                case "GUILD_MEMBER_ADD":
                    this.listeners["JoinAndLeave"].listen(true, data)
                    break;
                case "GUILD_MEMBER_REMOVE":
                    this.listeners["StaffUpdate"].listen(data)
                    this.listeners["JoinAndLeave"].listen(false, data)
                    break;
                case "GUILD_BAN_REMOVE":
                    this.listeners["RemoveBan"].listen(data)
                    break;
                case "GUILD_MEMBER_UPDATE":
                    this.listeners["StaffUpdate"].listen(data)
                    break;
                case "THREAD_CREATE":
                    this.listeners["JoinThread"].listen(data)
                    break;
            }
        }
    }
}

module.exports = ListenManager;