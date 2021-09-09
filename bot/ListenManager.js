const fs = require("fs");

class ListenManager {
    constructor(opt) {
        this.utils      = opt.utils;
        this.opt        = opt;
        this.listeners  = {}
    }

    async init() {
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

        switch(action) {
            case "MESSAGE_REACTION_ADD":
                break;
            case "MESSAGE_CREATE":
                this.listeners["DM"].listen(data)
                break;
            case "GUILD_MEMBER_ADD":
            case "GUILD_MEMBER_REMOVE":
                await this.listeners["LogJoinAndLeave"].listen(action, data)
                break;
            case "GUILD_BAN_REMOVE":
                await this.listeners["RemoveBan"].listen(data)
                break;
        }
    }
}

module.exports = ListenManager;