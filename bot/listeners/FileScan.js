const {NodeSSH} = require('node-ssh');

class FileScan {
    name = "FileScan"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
    }

    async listen(data) {
        if(data.attachments.length > 0 && data.author.id !== this.config.discord.clientId) {
            const guild         = this.clients.discord.getClient().guilds.cache.get(this.config.discord.guildId)
            const channel       = guild.channels.cache.get(data.channel_id)
            const message       = await channel.messages.fetch(data.id)
            const logsChannel   = guild.channels.cache.get(this.config.ids.channels.logs)
            const author        = guild.members.cache.get(data.author.id)
            const muteRole      = guild.roles.cache.get(this.config.ids.roles.muted)

            let react = await message.react("⚠")

            const ssh = new NodeSSH()

            await ssh.connect({
                host: this.config.server.antivirus.host,
                port: this.config.server.antivirus.port,
                username: this.config.server.antivirus.usr,
                password: this.config.server.antivirus.pwd
            })

            for(const [, attachment] of data.attachments.entries()) {
                if(attachment.content_type === undefined || !["image", "video", "audio"].includes(attachment.content_type)) {
                    await ssh.execCommand('wget -P /home/adminbsfr/scan ' + attachment.url)
                    this.utils.logger.log("[FileScan] Scanning a file sent by " + data.author.username + "#" + data.author.discriminator)

                    await react.remove()
                    react = await message.react("🔄")

                    const result = await ssh.execCommand('clamscan /home/adminbsfr/scan/' + attachment.filename + " --max-filesize=100M --max-scansize=100M")

                    await ssh.execCommand('rm /home/adminbsfr/scan/' + attachment.filename)

                    let infected = false

                    if(result.stdout.search("Infected files: 0") === -1) {
                        infected = true

                        await author.roles.add(muteRole)
                        await message.delete()
                        const warningMessage = await channel.send({content: "❗ **Le fichier `" + attachment.filename + "` envoyer par <@!" + data.author.id + "> est infecté ❗**\nSi une personne a télécharger ce fichier, nous vous recommandons fortement de supprimer ce dernier ainsi que d'effectuer une analyse anti-virus."})

                        let logsMessage = this.utils.embed.embed().setTitle("❗ Fichier infecté")
                            .setColor('#FF0000')
                            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.author.id + "/" + data.author.avatar + ".png")
                            .addField("Le méchant", "<@!" + data.author.id + ">", true)
                            .addField("Nom du fichier", attachment.filename, true)
                            .addField("Résultat du scan", result.stdout)

                        await logsChannel.send({content: "<@&" + this.config.ids.roles.moderator + ">", embeds: [logsMessage]})

                        await author.send("\n**[BSFR]**\n\nLe fichier `" + attachment.filename + "` est infecté \nIl a été supprimé et tu as été muté. \nUn membre du staff te contactera rapidement.")

                        setTimeout(function () {
                            warningMessage.delete()
                        }, 5000)
                    } else {
                        await react.remove()
                        react = await message.react("✅")
                    }

                    await this.clients.mongo.insert("historical", {
                        "type"      : "fileScanned",
                        "userId"    : data.author.id,
                        "filename"  : attachment.filename,
                        "infected"  : infected,
                        "date"      : (new Date()).getTime()
                    })
                }
            }

            await ssh.dispose()
        }
    }
}

module.exports = FileScan;