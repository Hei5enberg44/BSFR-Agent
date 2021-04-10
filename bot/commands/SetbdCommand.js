class SetbdCommand {

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
            Command: "setbd",
            Aliases: ["setbirthday"],
            Usage: "<jour> <mois> <année>",
            Description: "Assigne une date d'anniversaire.",
            Run: (args, message) => this.exec(args, message),
            ShowInHelp: true
        }
    }

    /**
     * Executor de la commande, ce qui va être exécuté quand la commande est effectuée.
     * @param args
     * @param message
     */
    async exec(args, message) {
        if(args.length < 3) {
            await message.channel.send("> :x: Merci de bien indiquer le jour, le mois et l'année de naissance")
            return 0;
        }

        if(args[2] < 1900 || args[2] > new Date().getFullYear()) {
            await message.channel.send("> :x: L'année de naissance doit être comprise entre 1900 et " + new Date().getFullYear())
            return 0;
        }

        let date = args[0] + '/' + args[1] + '/' + args[2]
        let regex = new RegExp('^(((0[1-9]|[12]\\d|3[01])\\/(0[13578]|1[02])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|[12]\\d|30)\\/(0[13456789]|1[012])\\/((19|[2-9]\\d)\\d{2}))|((0[1-9]|1\\d|2[0-8])\\/02\\/((19|[2-9]\\d)\\d{2}))|(29\\/02\\/((1[6-9]|[2-9]\\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$')

        if(!regex.test(date)) {
            await message.channel.send("> :x: Date invalide")
            return 0;
        }

        if(args[1] < 1 || args[1] > 12) {
            await message.channel.send("> :x: Mois invalide")
            return 0;
        }

        if(args[1] < 1 || args[1] > 31) {
            await message.channel.send("> :x: Mois invalide")
            return 0;
        }

        let validArgs = false;

        args.forEach(function (arg) {
            if(!isNaN(arg)) {
                validArgs = true
            }
        })

        let guild = await this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)
        let channel = guild.channels.cache.find(channel => channel.name === "birthday")

        if(message.channel !== channel) {
            return;
        }

        if(!validArgs) {
            await message.channel.send("> :x: Merci de bien des données valides")
            return 0;
        }

        try {
            let birthday = new Date(args[2] + '-' + args[1] + '-' + args[0]);
            let alreadySet = await this.clients.sql.query("SELECT * FROM birthday WHERE discord_id = " + message.member.user.id)

            if(alreadySet.length === 0) {
                await this.clients.sql.query("INSERT INTO birthday (discord_id, date) VALUES ('" + message.member.user.id + "', '" + args[2] + '-' + args[1] + '-' + args[0] + "')")
            } else {
                await this.clients.sql.query("UPDATE birthday SET date = '" + args[2] + '-' + args[1] + '-' + args[0] + "' WHERE discord_id = '" + message.member.user.id + "'")
            }

            await message.react("✅");
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = SetbdCommand;