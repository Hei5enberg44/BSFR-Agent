const mysql = require("mysql2/promise")
const bluebird = require("bluebird")

class SqlClient {

    /**
     * Constructeur du SqlClient
     * @param opt
     */
    constructor(opt) {
        this.config = opt.config;
    }

    /**
     * Getter pour le client.
     * @returns {Client | module:"discord.js".Client}
     */
    async getClient() {
        return (await mysql.createConnection({
            host: this.config.sql.host,
            user: this.config.sql.username,
            password: this.config.sql.password,
            database: this.config.sql.database,
            Promise: bluebird
        }));
    }

    async query(query) {
        const conn = await this.getClient()

        const [rows, fields] = await conn.execute(query)

        return rows
    }

}

module.exports = SqlClient;