const { MessageEmbed } = require("discord.js");

/**
 * Classe de standardisation des embeds.
 */
class Embed {

    /**
     * Fonction principale.
     */
    embed() {
        let info = require("../package.json");
        return new MessageEmbed()
            .setColor('#000000')
            .setFooter( info.displayName + ' ' + info.version + " | " + (new Date()).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }), 'https://cdn.discordapp.com/app-icons/694109037746323517/ea9e6a5b70270e83628706be0ae4a36a.png');
    }
}

module.exports = Embed;