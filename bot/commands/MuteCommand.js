class MuteCommand {

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
            Command: "mute",
            Aliases: [],
            Usage: "@mention `raison` temps",
            Description: "**[ADMIN - MODO]** Mute",
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
            return;
        }

        args[1] = args[1].slice(1)
        args[1] = args[1].slice(0, args[1].length - 1);

        // On récupère le temps
        let unit = args[2].charAt(args[2].length - 1).toUpperCase()
        let time = parseInt(args[2].slice(0, -1))
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
                break;
        }

        date = date.getFullYear() + '-' + ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " " + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2)

        let mutedMember = message.guild.members.resolve(args[0])
        let logsChannel = message.guild.channels.resolve(this.config.ids.channels.logs)
        let muteRole = message.guild.roles.cache.get(this.config.ids.roles.muted)

        let logsMessage = this.utils.Embed.embed().setTitle("🔇 Mute de " + mutedMember.user.username)
            .setColor('#4886f0')
            .setThumbnail("https://cdn.discordapp.com/avatars/" + mutedMember.user.id + "/" + mutedMember.user.avatar + ".png")
            .addField("Le vilain", "<@!" + mutedMember.user.id + ">", true)
            .addField("La sanction a été prononcé par", "<@!" + message.author.id + ">", true)
            .addField("Raison", args[1])
            .addField("Date Unmute", date)
            .addField("Date", ("0" + (new Date().getDate())).slice(-2) + "/" + ("0" + (new Date().getUTCMonth() + 1)).slice(-2) + "/" + new Date().getFullYear() + " " + ("0" + (new Date().getHours())).slice(-2) + ":" + ("0" + (new Date().getMinutes())).slice(-2) + ":" + ("0" + (new Date().getSeconds())).slice(-2))

        await mutedMember.roles.add(muteRole)
        await logsChannel.send(logsMessage)

        await mutedMember.send("\n**[BSFR]**\n\nTu as été muté pour la raison suivante: \n`" + args[1] + "`\n\nTu seras démuté le: " + date)

        await this.clients.sql.query("INSERT INTO mute (vilain_id, staff_id, reason, unmute_date) VALUES ('" + args[0] + "', '" + message.author.id + "', '" + escape(args[1]) + "', '" + date + "')")

        return;
    }
}

module.exports = MuteCommand;