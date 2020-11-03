class HelpCommand {

    /**
     * Constructeur de la commande
     * @param opt
     */
    constructor(opt) {
        this.clients = opt.clients;
        this.commands = opt.commands;
        this.utils = opt.utils;
        this.config = opt.config;

        this.emojis = {
            0: "🇦",
            1: "🇧",
            2: "🇨",
            3: "🇩",
            4: "🇪",
            5: "🇫",
            6: "🇬",
            7: "🇭",
            8: "🇮",
            9: "🇯",
            10: "🇰",
            11: "🇱",
            12: "🇲",
            13: "🇳",
            14: "🇴",
            15: "🇵",
            16: "🇶",
            17: "🇷",
            18: "🇸",
            19: "🇹"
            // 20: "🇧",
            // 21: "🇧",
            // 22: "🇧",
            // 23: "🇧",
        }
    }

    /**
     * Permet de récupérer la "metadata" de la commande.
     * @returns {{Usage: string, Description: string, Command: string, ShowInHelp: boolean, Run: (function(*=, *=): void), Aliases: [string, string]}}
     */
    getCommand() {
        return {
            Command: "rradd",
            Aliases: [],
            Usage: "<#channel> <`message`> <@role1> <@role2> ...",
            Description: "Crée un message d'attribution de rôles par réactions.",
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
            await message.channel.send("> :x: Merci d'indiquer un channel, un message ainsi qu'au moins 1 rôle")
        }

        let guild = this.clients.discord.getClient().guilds.cache.get(this.config.ids.guild)

        let channel = await guild.channels.cache.get(args[0]);

        // if(!channel) {
        //     await message.channel.send("> :x: Le channel ne semble pas existé")
        // }

        let roleNumbers = args.length - 2;
        let msg = args[1].replace(/`/g, '') + "\n";

        for(let i = 0; i < roleNumbers; i++) {
            msg += "\n";

            let role = await guild.roles.cache.get(args[i + 2])

            msg += this.emojis[i] + ": " + role.name
        }

        channel.send(msg)


        // console.log(args, message)
    }

}

module.exports = HelpCommand;