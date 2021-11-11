const { google } = require("googleapis")

class GoogleClient {
    constructor(opt) {
        this.config = opt.config;
        this.utils = opt.utils;
        this.clients = {}

        this.oAuth2Client = new google.auth.OAuth2(this.config.google.clientId, this.config.google.clientSecret, this.config.google.redirectUrl)

        this.utils.logger.log("[GoogleClient] Creating new google client")
    }

    async getAccessToken(clients) {
        this.clients = clients

        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId);
        this.adminChannel = guild.channels.cache.get(this.config.ids.channels.admin)

        const infos = await this.clients.mongo.find("googleApi", {})

        if (infos.length === 0)
            return this.authorize(1)

        if(infos[0].expirationDate < (new Date()).getTime())
            return this.refreshAccessToken(infos[0])

        return infos[0].accessToken
    }

    async refreshAccessToken(infos) {
        const token = await this.oAuth2Client.refreshToken(infos.refreshToken);

        if(token.res.status !== 200) {
            this.utils.logger.log("[GoogleClient] Something went wrong while refreshing token : " + token.res.status + " " + token.res.statusText)
            this.adminChannel.send({content: "Quelque chose c'est mal passé lors du refraichissement du token Google : " + token.res.status + " " + token.res.statusText})
        }

        const mongoUpdated = await this.clients.mongo.update("googleApi", {refreshToken: infos.refreshToken}, {
            $set: {
                accessToken: token.tokens.access_token,
                expirationDate: token.tokens.expiry_date,
                refreshNumber: infos.refreshNumber++,
            }
        })

        if(mongoUpdated){
            this.utils.logger.log("[GoogleClient] Token has been refreshed.")
            return token.tokens.access_token
        } else {
            this.utils.logger.log("[GoogleClient] Can't save token.")
            return token.tokens.access_token
        }
    }

    async authorize(part, code = null, interaction = null) {
        if(part === 1) {
            const authUrl = this.oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ["https://www.googleapis.com/auth/youtube.readonly"],
                prompt: 'consent'
            })

            await this.adminChannel.send({content: "<@&" + this.config.ids.roles.admin + "> Merci d'autoriser la connexion à Google via le lien suivant : " + authUrl});
            this.utils.logger.log("[GoogleClient] Authorization Needed")

            return "authorization needed";
        } else {
            let status = false;

            await this.oAuth2Client.getToken(code, async (err, token) => {
                if(err) {
                    this.utils.logger.log("[GoogleClient] An error occured while retrieving access token: " + err)
                    await this.adminChannel.send({content: "Un problème est survenu lors de la récupération du jeton d'accès."})
                }

                const mongoUpdated = await this.clients.mongo.insert("googleApi", {
                    accessToken: token.access_token,
                    expirationDate: token.expiry_date,
                    refreshNumber: 0,
                    refreshToken: token.refresh_token
                })

                if(mongoUpdated){
                    this.utils.logger.log("[GoogleClient] Token saved.")
                    return interaction.reply({content: "Authentification Google réussie."})
                } else {
                    this.utils.logger.log("[GoogleClient] Can't save token.")
                    return interaction.reply({content: "Erreur lors de l'authentification Google."})
                }
            })

            return status
        }
    }
}

module.exports = GoogleClient;