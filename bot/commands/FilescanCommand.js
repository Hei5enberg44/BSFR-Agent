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
            Command: "filescan",
            Aliases: ["options", "options2"],
            Usage: "",
            Description: "**[ADMIN]** Filescan command",
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
        let isAdmin = message.guild.members.resolve(message.author.id).roles.cache.some(r=>["admin", "Admin", "modérateur", "Modérateur"].includes(r.name));
        if(!isAdmin) {
            await message.react("❌");
            return;
        }

        let channel = await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild).channels.cache.get(this.config.ids.channels.bot_setup);

        if(channel !== message.channel) {
            return;
        }

        if(args[0] === "seeuserwarns") {
            if(args.length < 2) {
                await message.channel.send("> :x: Merci d'indiquer l'id de l'utilisateur (`filescan seeuserwarns userid`)")
                return;
            }

            // On récupère l'objet membre.
            let member = message.guild.members.resolve(args[1]);

            let warns = await this.clients.sql.query("SELECT id, DATE_FORMAT(date, '%d/%m/%Y') as date, filename FROM file_infected_history WHERE author_id = '" + args[1] + "'")

            let embed = this.utils.Embed.embed().setTitle("Historique Warn de " + member.user.username)
                .setColor('#FF0000')
                .setThumbnail("https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar + ".png")

            for(const warn of warns) {
                embed.addField("id", warn.id, true)
                embed.addField("Date", warn.date, true)
                embed.addField("Filename", warn.filename, true)
            }

            channel.send(embed)
        }

        if(args[0] === "seelastwarns") {
            // On récupère l'objet membre.
            let member = message.guild.members.resolve(args[1]);

            let limit = 10

            if (args.length > 1) {
                limit = args[1]
            }

            let warns = await this.clients.sql.query("SELECT id, DATE_FORMAT(date, '%d/%m/%Y') as date, author_id FROM file_infected_history LIMIT " + limit)

            let embed = this.utils.Embed.embed().setTitle("Historique Warn")
                .setColor('#FF0000')

            for(const warn of warns) {
                embed.addField("id", warn.id, true)
                embed.addField("Date", warn.date, true)
                embed.addField("User", "<@!" + warn.author_id + ">", true)
            }

            channel.send(embed)
        }

        if(args[0] === "seewarn") {
            if(args.length < 2) {
                await message.channel.send("> :x: Merci d'indiquer l'id du warn (`filescan seewarn warnid`)")
                return;
            }

            let warn = await this.clients.sql.query("SELECT id, author_id, DATE_FORMAT(date, '%d/%m/%Y') as date, filename, scan_result FROM file_infected_history WHERE id = '" + args[1] + "'")

            if(warn.length !== 0) {
                let member = message.guild.members.resolve(warn[0].author_id);

                channel.send(this.utils.Embed.embed().setTitle("Rapport Warn")
                    .setColor('#FF0000')
                    .setThumbnail("https://cdn.discordapp.com/avatars/" + member.user.id + "/" + member.user.avatar + ".png")
                    .addField("Date", warn[0].date)
                    .addField("Le méchant", "<@!" + warn[0].author_id + ">")
                    .addField("Nom du fichier", warn[0].filename)
                    .addField("Résultat du scan", warn[0].scan_result))
            } else {
                channel.send("> :x: Ce warn n'existe pas.")
            }


        }
    }
}

module.exports = RraddCommand;