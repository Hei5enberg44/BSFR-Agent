const fs = require("fs");
const cron = require("cron").CronJob;
const { unban } = require("./actions/Unban");
const { unmute } = require("./actions/Unmute");
const { wish } = require("./actions/BirthdayWish");
const { publish } = require("./actions/PublishYouTube");

class AutoActionsManager {
    constructor(opt) {
        this.clients        = opt.clients;
        this.utils          = opt.utils;
        this.config         = opt.config;
    }

    async init() {
        this.utils.logger.log("[AutoActionsManager] Initialisation")
        let self = this

        new cron('* * * * *', async function () {
            await unban(self)
            await unmute(self)
        }, null, true, 'Europe/Paris')

        new cron('0 0 * * *', async function () {
            await wish(self)
        }, null, true, 'Europe/Paris')

        new cron('5 19,20,21,22,23,0 * * *', async function () {
            await publish(self)
        }, null, true, 'Europe/Paris')
    }
}

module.exports = AutoActionsManager;