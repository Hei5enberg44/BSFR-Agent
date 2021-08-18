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
        let toReturn = await this.getInstance().get(key);
        this.utils.logger.log("[RedisClient] GET " + key)
        return toReturn;
    }

    async set(key, value) {
        let toReturn = await this.getInstance().set(key, value);
        this.utils.logger.log("[RedisClient] SET " + key + " VALUE " + value)
        return toReturn;
    }

    async del(key) {
        let toReturn = await this.getInstance().del(key);
        this.utils.logger.log("[RedisClient] DEL " + key)
        console.log();
        return toReturn;
    }
}

module.exports = RedisClient;
