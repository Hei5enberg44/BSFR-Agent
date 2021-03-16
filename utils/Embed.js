const Discord = require("discord.js");

/**
 * Classe de standardisation des embeds.
 */
class Embed {

    /**
     * Fonction principale.
     * @returns {module:"discord.js".MessageEmbed}
     */
    embed() {
        let info = require("../package.json");
        return new Discord.MessageEmbed()
            .setColor('#000000')
            .setFooter(info.displayName + ' ' + info.version, 'https://cdn.discordapp.com/app-icons/694109037746323517/aa6a888ce83a57b45105fa4506068cde.png?size=128');
    }
}

module.exports = Embed;