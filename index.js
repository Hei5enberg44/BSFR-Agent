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

        this.hb = [
            "hb. ",
            "Bon anniversaire ! ",
            "Wesh gros bon anniv' ",
            "You are vieux/vieille. ",
            "Allez hop une année de plus pour ",
            "Oof ",
            "Joyeux anniv ! (par contre calme toi ya pas de cadeau) ",
            "boomer. ",
            "Ca file le temps ... Bon anniv' ",
            "Alors, les rides ? ",
            "J'ai oublié ton cadeau ",
            "Tu n'as plus l'âge des cadeaux. ",
            "Merci d'être toujours plus vieux/vieille que moi ! ",
            "On n'est jamais trop vieux pour prendre des PP ! ",
            "Tu es comme le bon vin, tu te bonnifie avec l'âge <3 (calme toi par contre) ",
            "Le mieux pour the best ! Joyeux anniversaire ",
            "Bon tant qu'à faire j'en profite, Bonne année, joyeux noël, joyeuse paques, bonne vacances, et bon anniv' "
        ]

        this.bannedWord = 'excute|nigga|negro|nigger|négro|ex cute|exunreal cute|unreal cute'

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
            this.autoUnban();
            this.autoUnmute();
        });

        this.clients.discord.getClient().on('raw', async packet => {
            const action = packet.t;
            const data = packet.d;
            const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)

            console.log(data)

            if(action === "MESSAGE_REACTION_ADD" || action === "MESSAGE_REACTION_REMOVE"){

                if(action === "MESSAGE_REACTION_ADD") {
                    if(data.user_id !== this.config.ids.users.agent && data.channel_id === this.config.ids.channels.admin) {
                        let rows = await this.clients.sql.query("SELECT * FROM pending_ban WHERE message_id = '" + data.message_id + "'");

                        if(rows.length !== 0) {
                            if(data.emoji.name === "✅") {
                                let isAdmin = guild.members.resolve(data.user_id).roles.cache.some(r=>["admin", "Admin"].includes(r.name));
                                if(isAdmin) {
                                    let vilain = guild.members.resolve(rows[0].vilain_id)
                                    let ask = guild.members.resolve(rows[0].ask_id)
                                    let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)
                                    let date = rows[0].unban_date
                                    date = date.getFullYear() + '-' + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2)

                                    let logsMessage = this.utils.Embed.embed().setTitle("🔨 [ACCEPTÉ] Ban de " + vilain.user.username)
                                        .setColor('#F04848')
                                        .setThumbnail("https://cdn.discordapp.com/avatars/" + vilain.user.id + "/" + vilain.user.avatar + ".png")
                                        .addField("Le vilain", "<@!" + vilain.user.id + ">")
                                        .addField("La sanction a été demandé par", "<@!" + ask.user.id + ">", true)
                                        .addField("La sanction a été prononcée par", "<@!" + data.user_id + ">", true)
                                        .addField("Raison", unescape(rows[0].reason))
                                        .addField("Date de débanissement", date)
                                        .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

                                    await logsChannel.send(logsMessage)
                                    await vilain.send("\n**[BSFR]**\n\nTu as été banni pour la raison suivante: \n" + unescape(rows[0].reason))

                                    let askMessage = await guild.channels.cache.get(this.config.ids.channels.admin).messages.fetch(rows[0].message_id);
                                    let pingMessage = await guild.channels.cache.get(this.config.ids.channels.admin).messages.fetch(rows[0].ping_id);
                                    askMessage.delete()
                                    pingMessage.delete()

                                    await this.clients.sql.query("INSERT INTO ban (vilain_id, ask_id, reason, unban_date) VALUES ('" + vilain.user.id + "', '" + ask.user.id + "', '" + rows[0].reason + "', '" + date + "')")
                                    await vilain.ban({days: 0, reason: "Agent: " + unescape(rows[0].reason)})
                                    await this.clients.sql.query("DELETE FROM pending_ban WHERE id = " + rows[0].id)
                                }
                            } else if (data.emoji.name === "❌") {
                                let isAdmin = guild.members.resolve(data.user_id).roles.cache.some(r=>["admin", "Admin"].includes(r.name));
                                if(isAdmin) {
                                    let vilain = guild.members.resolve(rows[0].vilain_id)
                                    let ask = guild.members.resolve(rows[0].ask_id)
                                    let muteRole = guild.roles.cache.get(this.config.ids.roles.muted)

                                    await vilain.roles.remove(muteRole)

                                    let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)

                                    let logsMessage = this.utils.Embed.embed().setTitle("🔨 [REFUSÉ] Demande de ban de " + vilain.user.username)
                                        .setColor('#f07848')
                                        .setThumbnail("https://cdn.discordapp.com/avatars/" + vilain.user.id + "/" + vilain.user.avatar + ".png")
                                        .addField("Le vilain", "<@!" + vilain.user.id + ">")
                                        .addField("La sanction a été demandée par", "<@!" + ask.user.id + ">", true)
                                        .addField("La demande a été refusée par", "<@!" + data.user_id + ">", true)
                                        .addField("Raison", unescape(rows[0].reason))
                                        .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

                                    await logsChannel.send(logsMessage)

                                    let askMessage = await guild.channels.cache.get(this.config.ids.channels.admin).messages.fetch(rows[0].message_id);
                                    let pingMessage = await guild.channels.cache.get(this.config.ids.channels.admin).messages.fetch(rows[0].ping_id);
                                    askMessage.delete()
                                    pingMessage.delete()

                                    await vilain.send("\n**[BSFR]**\n\nLa demande de bannissement n'a pas été approuvée.\nTu es désormais démuté.")

                                    await this.clients.sql.query("DELETE FROM pending_ban WHERE id = " + rows[0].id)
                                }
                            }
                        }
                    }
                }
            }

            if(action === "MESSAGE_CREATE") {
                if(data.guild_id === undefined && data.author.id !== this.config.ids.users.agent) {
                    let agentDmChannel = guild.channels.resolve(this.config.ids.channels.agent_dm)
                    await agentDmChannel.send("<@!" + data.author.id + ">: " + data.content)
                }

                if(data.channel_id === this.config.ids.channels.agent_dm && data.referenced_message !== null && data.content.startsWith("!r ")) {
                    let message = await guild.channels.cache.get(data.channel_id).messages.fetch(data.id)
                    let membersToDM = await guild.members.cache.get(data.referenced_message.content.split('<@!').pop().split('>:')[0])
                    await membersToDM.send("<@!" + data.author.id + ">: " + data.content.split('!r ')[1])
                    await message.react("✅")
                }

                await this.filescan(packet)
                await this.checkBannedWord(packet)
            }

            if(action === "GUILD_MEMBER_REMOVE") {
                await this.leave(packet)
            }

            if(action === "GUILD_MEMBER_ADD") {
                await this.join(packet)
            }

            if(action === "GUILD_BAN_REMOVE") {
                await this.removeBan(packet)
            }
        })
    }

    async filescan(packet) {
        const data = packet.d;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
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
                            }
                        })
                    })
                })
            }
        }
    }

    async removeBan(packet) {
        const data = packet.d;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        const channel = guild.channels.cache.get(this.config.ids.channels.logs)

        let embed = this.utils.Embed.embed().setTitle("🔨 Déban de " + data.user.username)
            .setColor('#f07848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField("Date", ("0" + (new Date().getDate() + 1)).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours() + 1)).slice(-2) + ":" + ("0" + (new Date().getMinutes() + 1)).slice(-2) + ":" + ("0" + (new Date().getSeconds() + 1)).slice(-2))

        channel.send(embed)
    }

    async join(packet) {
        const data = packet.d;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        const channel = guild.channels.cache.get(this.config.ids.channels.logs)

        let embed = this.utils.Embed.embed().setTitle("📥 Arrivée de " + data.user.username)
            .setColor('#47EF66')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField("Koukou twa", "<@!" + data.user.id + ">")
            .addField("Date", ("0" + (new Date().getDate() + 1)).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours() + 1)).slice(-2) + ":" + ("0" + (new Date().getMinutes() + 1)).slice(-2) + ":" + ("0" + (new Date().getSeconds() + 1)).slice(-2))

        channel.send(embed)
    }

    async leave(packet) {
        const data = packet.d;
        const action = packet.a;
        const guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        const channel = guild.channels.cache.get(this.config.ids.channels.logs)

        // await this.sql.query("SELECT * FROM stats WHERE action = '" + action + "' AND ")

        let embed = this.utils.Embed.embed().setTitle("📤 Départ de " + data.user.username)
            .setColor('#F04848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.user.id + "/" + data.user.avatar + ".png")
            .addField("Orevouar", "<@!" + data.user.id + ">")
            .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

        channel.send(embed)
    }

    async birthday() {
        let guild = await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        let channel = guild.channels.cache.find(channel => channel.name === "happy-birthday")
        let sql = this.clients.sql
        let hb = this.hb

        new cron('1 0 * * *', async function () {
            let users = await sql.query("SELECT * FROM birthday WHERE MONTH(date) = " + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + " AND DAY(date) = " + ("0" + (new Date().getUTCDate())).slice(-2) + "")

            for (const user of users) {
                if(guild.members.cache.get(user.discord_id) === undefined) {
                    await sql.query("DELETE FROM birthday WHERE discord_id = '" + user.discord_id + "'")
                }

                channel.send(hb[Math.floor(Math.random() * hb.length)] + " <@" + user.discord_id + ">")
            }
        }, null, true, 'Europe/Paris')
    }

    async autoUnban() {
        let client = this.clients.discord.getClient()
        let guild = await client.guilds.cache.get(this.config.ids.guild)
        let modsChannel = guild.channels.resolve(this.config.ids.channels.moderation)
        let sql = this.clients.sql
        let config = this.config

        new cron('0 0,12 * * *', async function () {
            let date = new Date()
            date = date.getFullYear() + '-' + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2)

            let bans = await sql.query("SELECT * FROM ban WHERE unban_date <= '" + date + "'")

            for (const ban of bans) {
                let vilain = await client.users.fetch(ban.vilain_id)
                let ask = await client.users.fetch(ban.ask_id)

                await guild.members.unban(ban.vilain_id)
                await modsChannel.send("<@&" + config.ids.roles.admin +  "> <@&" + config.ids.roles.mods + ">\n\nDéban de " + vilain.username + "#" + vilain.discriminator + ".\n\nPour rappel, il avait été ban par " + ask.username + "#" + ask.discriminator + " pour la raison suivante:\n`" + unescape(ban.reason) + "`\n\nMerci de prendre contact avec " + vilain.username + "#" + vilain.discriminator + "\n\nLien d'invitation discord: " + config.links.invite)
                await sql.query("DELETE FROM ban WHERE id = " + ban.id)
            }
        }, null, true, 'Europe/Paris')
    }

    async autoUnmute() {
        let client = this.clients.discord.getClient()
        let guild = await client.guilds.cache.get(this.config.ids.guild)
        let logsChannel = guild.channels.resolve(this.config.ids.channels.logs)
        let muteRole = guild.roles.cache.get(this.config.ids.roles.muted)
        let sql = this.clients.sql
        let embed = this.utils.Embed
        let config = this.config

        new cron('* * * * *', async function () {
            let date = new Date()
            date = date.getFullYear() + '-' + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2)

            let mutes = await sql.query("SELECT * FROM mute WHERE unmute_date <= '" + date + "'")

            for (const mute of mutes) {
                let vilain = await guild.members.fetch(mute.vilain_id)
                let staff = await guild.members.fetch(mute.staff_id)

                await vilain.roles.remove(muteRole)

                await vilain.send("\n**[BSFR]**\n\nTu as été démuté ! \n\n Pour rappel, tu avais été muté pour la raison suivante: \n`" + unescape(mute.reason) + "`")

                let logsMessage = embed.embed().setTitle("🔇 Unmute de " + vilain.user.username)
                    .setColor('#1b427c')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + vilain.user.id + "/" + vilain.user.avatar + ".png")
                    .addField("Le vilain", "<@!" + vilain.user.id + ">", true)
                    .addField("La sanction avait été prononcé par", "<@!" + staff.user.id + ">")
                    .addField("Raison", unescape(mute.reason), true)
                    .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

                await logsChannel.send(logsMessage)
                await sql.query("DELETE FROM mute WHERE id = " + mute.id)
            }
        }, null, true, 'Europe/Paris')
    }

    async checkBannedWord(packet) {
        const data = packet.d;
        const regex = new RegExp(this.bannedWord)
        let modsChannel = await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild).channels.resolve(this.config.ids.channels.moderation)
        let message = data.content.toLowerCase()

        if(regex.test(message)) {
            let words = ""
            for(let word of message.matchAll(this.bannedWord)) {
                words += word + ", "
            }

            let logsMessage = this.utils.Embed.embed().setTitle("⛔ Usage de mots interdits")
                .setColor('#F04848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + data.author.id + "/" + data.author.avatar + ".png")
                .addField("Le vilain", "<@!" + data.author.id + ">")
                .addField("Les mots interdits utilisés", words)
                .addField("Message", message)
                .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

            await modsChannel.send("<@&" + this.config.ids.roles.mods + ">")
            await modsChannel.send(logsMessage)
        }
    }
}

let Index = new TheCoolerBot();