const { TwitterApi } = require("twitter-api-v2");

class TwitterClient {

    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils

        this.utils.logger.log("[TwitterClient] Creating new twitter client")

        this.client = new TwitterApi({
            appKey: this.config.twitter.appKey,
            appSecret: this.config.twitter.appSecret,
            accessToken: this.config.twitter.accessToken,
            accessSecret: this.config.twitter.accessSecret
        });
    }

    async tweet(content) {
        return this.client.v1.tweet(content)
    }

    /**
     * Getter pour le client.
     */
    getClient() {
        return this.client;
    }

}

module.exports = TwitterClient;