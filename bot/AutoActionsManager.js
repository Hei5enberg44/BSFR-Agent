const Cron = require("cron").CronJob
const { unban } = require("./actions/Unban")
const { unmute } = require("./actions/Unmute")
const { wish } = require("./actions/BirthdayWish")
const { publish } = require("./actions/PublishYouTube")

class AutoActionsManager {
    constructor(opt) {
        this.clients    = opt.clients
        this.utils      = opt.utils
        this.config     = opt.config
        this.guild      = opt.guild
    }

    async init(guild) {
        this.guild = guild
        let self = this

        this.utils.logger.log("[AutoActionsManager] Initialisation")

        new Cron('* * * * *', async function () {
            await unban(self)
            await unmute(self)
        }, null, true, 'Europe/Paris')

        new Cron('0 0 * * *', async function () {
            await wish(self)
        }, null, true, 'Europe/Paris')

        new Cron('5 19-23 * * *', async function () {
            await publish(self)
        }, null, true, 'Europe/Paris')
    }
}

module.exports = AutoActionsManager;