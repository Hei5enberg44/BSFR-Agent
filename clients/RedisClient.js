const Redis = require("ioredis");

class RedisClient {

    /**
     * Constructeur du RedisClient
     * @param opt
     */
    constructor(opt) {
        // On instancie le client et on se connecte au serveur Redis
        this.redisInstance = new Redis({
            port: opt.config.redis.port,
            host: opt.config.redis.host,
            password: opt.config.redis.password,
            db: opt.config.redis.database
        });

        this.utils = opt.utils
    }

    /**
     * Getter pour l'instance Redis.
     * @returns {Redis}
     */
    getInstance() {
        return this.redisInstance;
    }

    async get(key) {
        this.utils.logger.log("[RedisClient] Get " + key)
        return await this.getInstance().get(key);
    }

    async getJson(key) {
        this.utils.logger.log("[RedisClient] Get JSON " + key)
        return JSON.parse(await this.getInstance().get(key))
    }

    async set(key, value) {
        this.utils.logger.log("[RedisClient] Set " + key + " VALUE " + value)
        return await this.getInstance().set(key, value);
    }

    async setJsonEntries(key, jsonEntries) {
        this.utils.logger.log("[RedisClient] Set " + key + " new JSON entries " + JSON.stringify(jsonEntries))
        let user = await this.getJson(key)

        if(user !== null) {
            this.utils.logger.log("[RedisClient] User " + key + " found")
            Object.keys(jsonEntries).forEach(function(key) {
                user[key] = jsonEntries[key]
            })
        } else {
            this.utils.logger.log("[RedisClient] User " + key + " not found")
        }

        return await this.set(key, JSON.stringify(jsonEntries))
    }

    async del(key) {
        this.utils.logger.log("[RedisClient] DEL " + key)
        return await this.getInstance().del(key);
    }
}

module.exports = RedisClient;
