const axios = require('axios');

class TwitchClient {
    clips_url = "https://clips.twitch.tv/"

    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils

        this.utils.logger.log("[TwitchClient] Creating new twitch client")
    }

    async getToken() {
        const params = new URLSearchParams({
            client_id: this.config.twitch.clientId,
            client_secret: this.config.twitch.clientSecret,
            grant_type: "client_credentials",
        }).toString();

        const url = "https://id.twitch.tv/oauth2/token?" + params;

        let auth = await axios.post(url)

        return auth.data.access_token
    }

    async getClipInfo(link) {
        let id = null

        if(link.includes(this.clips_url))
            id = link.split(this.clips_url)[1]
        else
            return false

        let clip = await axios.get("https://api.twitch.tv/helix/clips", {
            headers: {
                Authorization: "Bearer " + await this.getToken(),
                'Client-Id': this.config.twitch.clientId,
            },
            params: {
                id
            }
        })

        if(clip.data.data.length === 0)
            return null;

        clip.data.data[0]["download_url"] = clip.data.data[0].thumbnail_url.split("-preview")[0] + ".mp4"

        return clip.data.data[0]
    }
}

module.exports = TwitchClient;