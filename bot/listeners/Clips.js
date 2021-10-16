const axios = require("axios")
const fs = require("fs")
const {NodeSSH} = require("node-ssh")
const crypto = require('crypto');

class Clips {
    name        = "Clips"
    clips_url   = "https://clips.twitch.tv/"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
        this.ssh        = new NodeSSH()
    }

    async connectSsh() {
        if(!this.ssh.isConnected()) {
            await this.ssh.connect({
                host: this.config.server.cdn.host,
                port: this.config.server.cdn.port,
                username: this.config.server.cdn.usr,
                password: this.config.server.cdn.pwd
            })
        }
    }

    async listen(data) {
        if(data.channel_id === this.config.ids.channels.clips) {
            const thread = await this.guild.channels.fetch(this.config.ids.channels.reuploadedClips)

            // Only get array of twitch clips link
            let clipLinks = data.content.split(" ").filter(part => part.includes(this.clips_url))

            // If there is at least 1 clip link
            if(clipLinks.length > 0)
                this.utils.logger.log("[Clips] Receiving clips from " + data.author.username + "#" + data.author.discriminator)

            for(let i in clipLinks) {
                let clip = await this.clients.twitch.getClipInfo(clipLinks[i])

                if(clip !== null)
                    await this.download(thread, clip.download_url, "Twitch-" + clip.broadcaster_name)
                else
                    this.utils.logger.log("[Clips] Impossible to download clip " + clipLinks[i] + " from " + data.author.username + "#" + data.author.discriminator)
            }

            for(let i in data.attachments) {
                // If a video has been attached to the message
                if(data.attachments[i].content_type.includes("video")) {
                    this.utils.logger.log("[Clips] Receiving clips from " + data.author.username + "#" + data.author.discriminator)
                    await this.download(thread, data.attachments[i].url, "Discord-" + data.author.id)
                }
            }
        }
    }

    async download(thread, url, author) {
        // Generate a random file name
        let fileName = crypto.randomBytes(30).toString('hex').slice(0, 30);
        let path = "./temp/" + fileName + ".mp4"

        this.utils.logger.log("[Clips] Downloading clip " + fileName)

        let response = null

        // Try to download the clip
        try {
            response = await axios({
                url,
                method: "GET",
                responseType: "stream"
            })
        } catch (e) {
            this.utils.logger.log("[Clips] Can't download clip: " + url)
            return false;
        }

        // Try to save the clip
        try {
            const w = response.data.pipe(fs.createWriteStream(path));

            w.on('finish', async () => {
                this.utils.logger.log("[Clips] Successfully downloaded clip " + fileName)

                await this.connectSsh()

                this.utils.logger.log("[Clips] Uploading clip " + fileName)

                await this.ssh.putFile(path,this.config.server.cdn.path + "clips/" + author + "/" + fileName + ".mp4")

                this.utils.logger.log("[Clips] Successfully uploaded clip " + fileName + " to cdn")

                // Deleting the clip from local storage
                fs.unlinkSync(path)

                // If the clips thread is archived
                if(thread.archived) {
                    this.utils.logger.log("[Clips] Unarchiving Thread")
                    await thread.setArchived(false)
                }

                if(thread.locked) {
                    this.utils.logger.log("[Clips] Unlocking Thread")
                    await thread.setLocked(false)
                }

                await thread.send({content: "https://cdn.bsaber.fr/clips/" + author + "/" + fileName + ".mp4"})
                this.utils.logger.log("[Clips] Successfully send clip " + fileName + " to channel")
            });
        } catch (e) {
            this.utils.logger.log("[Clips] Something went wrong while saving / uploading the clip: " + url)
        }
    }
}

module.exports = Clips