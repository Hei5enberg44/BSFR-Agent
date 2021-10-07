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

    async init(guild) {
        this.opt.guild = guild

        this.utils.logger.log("[ListenManager] Initialisation")

        // For each files in folder
        fs.readdirSync("./bot/listeners/").forEach(file => {
            let listen = new (require("./listeners/" + file))(this.opt)

            this.utils.logger.log("[ListenManager] Find '" + listen.name + "'")

            this.listeners[listen.name] = listen
        })
    }

    async listen(packet) {
        const action    = packet.t;
        const data      = packet.d;

        // If there is data and the guild ID is the same has the selected discord server or if it's a DM
        if(data && (data.guild_id === this.config.discord.guildId || data.guild_id === undefined)) {
            switch(action) {
                case "MESSAGE_REACTION_ADD":
                    this.listeners["ValidationBan"].listen(data)
                    this.listeners["ValidationTweet"].listen(data)
                    this.listeners["ValidationRemove"].listen(data)
                    break;
                case "MESSAGE_CREATE":
                    this.listeners["DM"].listen(data)
                    this.listeners["BannedWords"].listen(data)
                    this.listeners["FileScan"].listen(data)
                    this.listeners["Clips"].listen(data)
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
                case "PRESENCE_UPDATE":
                    this.listeners["Stream"].listen(data)
                    break;
                case "THREAD_CREATE":
                    this.listeners["JoinThread"].listen(data)
                    break;
            }
        }
    }
}

module.exports = ListenManager;