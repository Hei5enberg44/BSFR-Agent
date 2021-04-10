class RraddCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "ban",
            Aliases: [],
            Usage: "@mention `raison` temps",
            Description: "**[ADMIN]** Ban",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: false
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {
        // On vérifie si l'utilisateur est un admin
        let isAdmin = message.guild.members.resolve(message.author.id).roles.cache.some(r=>["admin", "Admin"].includes(r.name));
        let isModo = message.guild.members.resolve(message.author.id).roles.cache.some(r=>["modérateur", "Modérateur"].includes(r.name));

        if(!isAdmin && !isModo) {
            await message.react("❌");
            return;
        }

        if(args.length < 3) {
            await message.channel.send("> :x: Merci d'indiquer l'ensemble des informations nécessaires")
        }

        args[1] = args[1].slice(1)
        args[1] = args[1].slice(0, args[1].length - 1);

        // On vérifie si l'utilisateur est un admin
        let unit = args[2].charAt(args[2].length - 1).toUpperCase()
        let time = args[2].slice(0, -1)
        let date = new Date()

        switch (unit) {
            case "S":
                date.setSeconds(date.getSeconds() + time)
                break;
            case "I":
                date.setSeconds(date.getSeconds() + (time * 60))
                break;
            case "H":
                date.setSeconds(date.getSeconds() + (time * 60 * 60))
                break;
            case "D":
                date.setSeconds(date.getSeconds() + (time * 24 * 60 * 60))
                break;
            case "W":
                date.setSeconds(date.getSeconds() + (time * 7 * 24 * 60 * 60))
                break;
            case "M":
                date.setSeconds(date.getSeconds() + (time * 4.35 * 7 * 24 * 60 * 60))
                break;
            case "Y":
                date.setSeconds(date.getSeconds() + (time * 12 * 4.35 * 7 * 24 * 60 * 60))
        }

        date = date.getFullYear() + '-' + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2)

        if(isAdmin) {
            this.ban(message, args[0], args[1], message.author.id, date)
            return;
        } else if (isModo) {
            let member = message.guild.members.resolve(args[0])
            let adminChannel = message.guild.channels.resolve(this.config.ids.channels.admin)
            let muteRole = message.guild.roles.cache.get(this.config.ids.roles.muted)

            let moderationMessage = this.utils.Embed.embed().setTitle("🔨 Demande de ban de " + member.user.username)
                .setColor('#f07848')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar + ".png")
                .addField("Le vilain", "<@!" + member.user.id + ">", true)
                .addField("La sanction a été demandée par", "<@!" + message.author.id + ">", true)
                .addField("Raison", args[1])
                .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

            await member.roles.add(muteRole)
            let ping_message = await adminChannel.send("<@&" + this.config.ids.roles.admin +  ">")
            let pending_message = await adminChannel.send(moderationMessage)
            await pending_message.react("✅")
            await pending_message.react("❌")

            await member.send("\n**[BSFR]**\n\nUne demande de bannissement à ton encontre est en attente pour la raison suivante: \n" + args[1] + "\n\nTu as été temporairement muté le temps qu'une décision soit prise.")

            await this.clients.sql.query("INSERT INTO pending_ban (message_id, vilain_id, ask_id, reason, unban_date, ping_id) VALUES ('" + pending_message.id + "', '" + args[0] + "', '" + message.author.id + "', '" + escape(args[1]) + "', '" + date + "', '" + ping_message.id + "')")

            await message.react("🔄")

            return;
        } else {
            await message.react("❌");
            return;
        }
    }

    async ban(message, userId, reason, whoBan, date) {
        let member = message.guild.members.resolve(userId)
        let logsChannel = message.guild.channels.resolve(this.config.ids.channels.logs)
        await this.clients.sql.query("INSERT INTO ban (vilain_id, ask_id, reason, unban_date) VALUES ('" + member.user.id + "', '" + whoBan + "', '" + escape(reason) + "', '" + date + "')")

        let logsMessage = this.utils.Embed.embed().setTitle("🔨 Ban de " + member.user.username)
            .setColor('#F04848')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar + ".png")
            .addField("Le vilain", "<@!" + member.user.id + ">", true)
            .addField("La sanction a été prononcée par", "<@!" + whoBan + ">", true)
            .addField("Raison", reason)
            .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

        await logsChannel.send(logsMessage)
        await member.send("\n**[BSFR]**\n\nTu as été banni pour la raison suivante: \n" + reason)

        await member.ban({days: 0, reason: reason})
    }
}

module.exports = RraddCommand;