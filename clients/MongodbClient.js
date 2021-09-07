const { MongoClient } = require("mongodb");

class MongodbClient {

    /**
     * Constructeur du MongodbClient
     * @param opt
     */
    constructor(opt) {
        this.mongoClient = new MongoClient("mongodb://" + opt.config.mongodb.username + ":" + opt.config.mongodb.password + "@" + opt.config.mongodb.host + ":" + opt.config.mongodb.port)

        this.utils = opt.utils
        this.config = opt.config

        this.db = null
        this.isConnected = false
    }

    async connect() {
        this.utils.logger.log("[MongoDB] Connecting...")

        if(!this.isConnected) {
            try {
                await this.mongoClient.connect()

                this.utils.logger.log("[MongoDB] SUCCESS: Connected")
                this.isConnected = true
                this.db = this.mongoClient.db(this.config.mongodb.database)
            } catch (e) {
                this.utils.logger.log("[MongoDB] ERROR: " + e.codeName)
            }
        }
    }

    async find(collection, finder) {
        this.utils.logger.log("[MongoDB] find - Collection selected: " + collection)

        let document = await this.db.collection(collection).find(finder).toArray()

        if(document.length === 0)
            this.utils.logger.log("[MongoDB] find - Can't find " + JSON.stringify(finder))
        else
            this.utils.logger.log("[MongoDB] find - Found " + JSON.stringify(finder))

        return document
    }

    async insertOrUpdate(collection, finder, document) {
        this.utils.logger.log("[MongoDB] insertOrUpdate - Collection selected: " + collection)

        let documentExist = await this.find(collection, finder)
        let log = ""

        try {
            if(documentExist.length === 0) {
                await this.db.collection(collection).insertMany([Object.assign(finder, document)])
                log = "Insert " + JSON.stringify(Object.assign(finder, document))
            } else {
                await this.db.collection(collection).updateOne(finder, { $set: document })
                log = "Update " + JSON.stringify(finder) + " with values " + JSON.stringify(document)
            }
        } catch (e) {
            this.utils.logger.log("[MongoDB] insertOrUpdate - ERROR: " + e.codeName)
            return false
        }

        this.utils.logger.log("[MongoDB] insertOrUpdate - " + log)
        return true
    }

    async insert(collection, document) {
        this.utils.logger.log("[MongoDB] insert - Collection selected: " + collection)
        try {
            await this.db.collection(collection).insertMany([document])
        } catch (e) {
            this.utils.logger.log("[MongoDB] insertOrUpdate - ERROR: " + e.codeName)
            return false
        }

        this.utils.logger.log("[MongoDB] insert - Insert " + JSON.stringify(document))
        return true
    }

    async remove(collection, finder) {
        this.utils.logger.log("[MongoDB] remove - Collection selected: " + collection)

        let deleted = await this.db.collection(collection).deleteMany(finder)

        if(deleted.deletedCount === 0)
            this.utils.logger.log("[MongoDB] remove - " + JSON.stringify(finder) + " was not deleted")
        else
            this.utils.logger.log("[MongoDB] remove - " + JSON.stringify(finder) + " have been deleted")

        return deleted.deletedCount
    }
}

module.exports = MongodbClient;
