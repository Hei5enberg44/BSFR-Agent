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
        console.log(args, message)
    }

}

module.exports = HelpCommand;