const cron = require('cron').CronJob;
const {NodeSSH} = require('node-ssh');

class TheCoolerBot {

    constructor() {

        // Déclaration de la configuration

        this.config = require("./config.json");

        // Global setup

        // let SSH = require('simple-ssh');
        //
        // this.global = {
        //     ssh: new SSH({
        //         host: this.config.server.antivirus.host,
        //         port: this.config.server.antivirus.port,
        //         user: this.config.server.antivirus.usr,
        //         pass: this.config.server.antivirus.pwd
        //     })
        // }

        // Déclaration des clients

        let clients = {
            Discord: require("./clients/DiscordClient.js"),
            Sql: require("./clients/SqlClient.js")
        };

        // Instanciation des clients

        this.clients = {
            discord: new clients.Discord(this),
            sql: new clients.Sql(this),
            // redis: new clients.Redis(this),
            // raw: {
            //     redis: clients.Redis
            // }
        };

        // Déclaration des utils

        this.utils = {
            Logger: new (require("./utils/Logger.js")),
            Embed: new (require("./utils/Embed.js")),
            DiscordServer: new (require("./utils/DiscordServer.js"))({clients: this.clients})
        };

        // Instanciation des reactions

        this.reactions = {
            Roles: new (require("./reactions/Roles.js"))({logger: this.utils.Logger}),
        }

        // Instanciation et initialisation des Managers

        let managers = {
            Commands: require("./bot/CommandManager.js")
        };

        this.managers = {
            commands: new managers.Commands(this)
        };

        // Initialisation du bot

        this.init()
    }

    async init() {
        // On fait login le bot à la gateway de Discord.
        this.clients.discord.loginClient();

        this.clients.discord.getClient().on("ready", async () => {
            this.utils.Logger.log("Discord: Ready.");

            // On change l'activité du bot.
            await this.clients.discord.getClient().user.setActivity(this.config.discord.prefix + 'help - By Krixs', {
                type: "LISTENING"
            });

            await this.clients.discord.getClient().channels.cache.get(this.config.ids.channels.roles).messages.fetch();

            await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild).members.fetch();

            // On démarre le CommandManager.
            this.managers.commands.init();

            this.birthday();
        });

        this.clients.discord.getClient().on('raw', async packet => {
            const action = packet.t;
            const data = packet.d;
            const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)

            if(action === "MESSAGE_REACTION_ADD" || action === "MESSAGE_REACTION_REMOVE"){
                let member = guild.members.cache.get(data.user_id)

                switch(data.message_id) {
                    case this.config.ids.message.grip:
                        this.reactions.Roles.grip(action, guild, member, this.config.ids.roles, data.emoji.name);
                        break;
                }
            }

            if(action === "MESSAGE_CREATE") {
                const channel = guild.channels.cache.get(data.channel_id)
                const logsChannel = guild.channels.cache.get(this.config.ids.channels.logs)
                const muteRole = guild.roles.cache.get(this.config.ids.roles.muted)
                const author = guild.members.cache.get(data.author.id)
                const embed = this.utils.Embed.embed()
                const sql = this.clients.sql

                if(data.attachments.length !== 0 && data.author.id !== this.config.discord.id) {
                    if(
                        data.attachments[0].content_type === undefined
                        || (
                            !data.attachments[0].content_type.includes("image")
                            && !data.attachments[0].content_type.includes("video")
                            && !data.attachments[0].content_type.includes("audio")
                        )
                    )
                    {
                        let message = await channel.send("⚠ Fichier non analysé ⚠")

                        const ssh = new NodeSSH()

                        ssh.connect({
                            host: this.config.server.antivirus.host,
                            port: this.config.server.antivirus.port,
                            username: this.config.server.antivirus.usr,
                            password: this.config.server.antivirus.pwd
                        }).then(function () {
                            ssh.execCommand('wget -P /home/adminbsfr/scan ' + data.attachments[0].url).then(async function(result) {
                                // await channel.messages.fetch(data.id).then(message => {message.delete()})
                                console.log("Analyse d'un fichier en cours")
                                message.edit("🔄 Analyse du fichier en cours 🔄")

                                ssh.execCommand('clamscan /home/adminbsfr/scan/' + data.attachments[0].filename + " --max-filesize=100M --max-scansize=100M").then(async function(result) {
                                    if(result.stdout.search("Infected files: 0") === -1) {
                                        await ssh.execCommand('rm /home/adminbsfr/scan/' + data.attachments[0].filename)

                                        await author.roles.add(muteRole)

                                        await sql.query("INSERT INTO file_infected_history (author_id, date, filename, scan_result) VALUES ('" + author.user.id + "', '" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds() + "', '" + data.attachments[0].filename + "', '" + result.stdout + "')")
                                        let count = await sql.query("SELECT COUNT(author_id) AS warn FROM file_infected_history WHERE author_id = '" + author.user.id + "'")
                                        await sql.query("SELECT COUNT(author_id) AS warn FROM file_infected_history WHERE author_id = '" + author.user.id + "'")

                                        message.edit("❗ " + data.attachments[0].filename + " - Fichier Infecté ❗")

                                        embed.setTitle("Fichier infecté")
                                            .setColor('#FF0000')
                                            .setThumbnail("https://cdn.discordapp.com/avatars/" + author.user.id + "/" + author.user.avatar + ".png")
                                            .addField("Date", new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear() + " " + new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds())
                                            .addField("Le méchant", "<@!" + author.user.id + ">", true)
                                            .addField("Nombre de Warn", count[0].warn, true)
                                            .addField("Nom du fichier", data.attachments[0].filename)
                                            .addField("Résultat du scan", result.stdout)

                                        await logsChannel.send(embed)
                                        await author.send("\n**[BSFR]**\n\nLe fichier `" + data.attachments[0].filename + "` est infecté \nIl a été supprimé et tu as été muté. \nUn membre du staff te contactera rapidement.")

                                        await channel.messages.fetch(data.id).then(message => {message.delete()})

                                        setTimeout(function () {
                                            message.delete()
                                        }, 300000)
                                    } else {
                                        await ssh.execCommand('rm /home/adminbsfr/scan/' + data.attachments[0].filename)

                                        message.edit("✅ Fichier OK ✅")

                                        // await ssh.getFile('./temp/' + data.attachments[0].filename,'/home/adminbsfr/scan/' + data.attachments[0].filename).then(async function (Contents) {
                                        //     console.log("Fichier Vérifié et retélécharger")
                                        //
                                        //     const { MessageAttachment } = require("discord.js");
                                        //     const attachments = new MessageAttachment("./temp/" + data.attachments[0].filename)
                                        //     message.delete()
                                        //     await channel.send("✅ Fichier OK ✅ \n\n By " + author.username, attachments, "")
                                        //
                                        //     var fs = require('fs');
                                        //     fs.unlinkSync('./temp/' + data.attachments[0].filename);
                                        //
                                        //     ssh.execCommand('rm /home/adminbsfr/scan/' + data.attachments[0].filename).then(async function(result) {
                                        //         console.log("Deleted")
                                        //     })
                                        // })
                                    }


                                })
                            })
                        })
                    }

                }
            }
        })
    }

    async birthday() {
        let today = new Date()
        let guild = await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        let channel = guild.channels.cache.find(channel => channel.name === "happy-birthday")
        let sql = this.clients.sql

        new cron('0 0 * * *', async function () {
            let users = await sql.query("SELECT * FROM birthday WHERE MONTH(date) = " + ("0" + (today.getUTCMonth() + 1)).slice(-2) + " AND DAY(date) = " + ("0" + (today.getUTCDate() + 1)).slice(-2) + "")
            for (const user of users) {
                if(guild.members.cache.get(user.discord_id) === undefined) {
                    await sql.query("DELETE FROM birthday WHERE discord_id = '" + user.discord_id + "'")
                }

                channel.send("Eh joyeux anniv à <@" + user.discord_id + ">")
            }
        }, null, true, 'Europe/Paris')
    }
}

let Index = new TheCoolerBot();