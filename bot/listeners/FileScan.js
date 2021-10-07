const {NodeSSH} = require('node-ssh');

class FileScan {
    name = "FileScan"

    constructor(opt) {
        this.clients    = opt.clients
        this.config     = opt.config
        this.utils      = opt.utils
        this.guild      = opt.guild
    }

    async listen(data) {
        if(data.attachments.length > 0 && data.author.id !== this.config.discord.clientId) {
            const channel       = this.guild.channels.cache.get(data.channel_id)
            const logsChannel   = this.guild.channels.cache.get(this.config.ids.channels.logs)
            const author        = this.guild.members.cache.get(data.author.id)
            const muteRole      = this.guild.roles.cache.get(this.config.ids.roles.muted)
            const message       = await channel.messages.fetch(data.id)

            const ssh = new NodeSSH()

            await ssh.connect({
                host: this.config.server.antivirus.host,
                port: this.config.server.antivirus.port,
                username: this.config.server.antivirus.usr,
                password: this.config.server.antivirus.pwd
            })

            for(const [, attachment] of data.attachments.entries()) {
                // If the attachment is not an image, video or audio
                if(
                    attachment.content_type === undefined
                    || (
                        !attachment.content_type.includes("image")
                        && !attachment.content_type.includes("video")
                        && !attachment.content_type.includes("audio")
                    )
                ) {
                    let react = await message.react("⚠")

                    // Remote download the attachment
                    await ssh.execCommand('wget -P /home/adminbsfr/scan ' + attachment.url)
                    this.utils.logger.log("[FileScan] Scanning a file sent by " + data.author.username + "#" + data.author.discriminator)

                    await react.remove()
                    react = await message.react("🔄")

                    // Start the scan
                    const result = await ssh.execCommand('clamscan /home/adminbsfr/scan/' + attachment.filename + " --max-filesize=100M --max-scansize=100M")

                    // When the scan is done, delete the attachment from the remote server
                    await ssh.execCommand('rm /home/adminbsfr/scan/' + attachment.filename)

                    let infected = false

                    // If the scan result shows that there is more than infected files.
                    if(result.stdout.search("Infected files: 0") === -1) {
                        infected = true

                        // Mute the attachement sender
                        await this.clients.mongo.insertOrUpdate("users", { discordId: author.user.id }, {
                            "muteReason": "infected files",
                        })

                        await this.clients.mongo.insert("historical", {
                            "type"      : "mute",
                            "userId"    : author.user.id,
                            "muteReason": "infected files",
                            "date"      : (new Date()).getTime()
                        })

                        await author.roles.add(muteRole)

                        // Delete the attachment
                        await message.delete()

                        // Send a warning message
                        const warningMessage = await channel.send({content: "❗ **Le fichier `" + attachment.filename + "` envoyé par <@!" + data.author.id + "> est infecté ❗**\nSi l'un d'entre vous a téléchargé ce fichier, nous vous recommandons fortement de supprimer ce dernier ainsi que d'effectuer une analyse anti-virus."})

                        let logsMessage = this.utils.embed.embed().setTitle("❗ Fichier infecté")
                            .setColor('#FF0000')
                            .setThumbnail("https://cdn.discordapp.com/avatars/" + data.author.id + "/" + data.author.avatar + ".png")
                            .addField("Le méchant", "<@!" + data.author.id + ">", true)
                            .addField("Nom du fichier", attachment.filename, true)
                            .addField("Résultat du scan", result.stdout)

                        await logsChannel.send({content: "<@&" + this.config.ids.roles.moderator + ">", embeds: [logsMessage]})

                        await author.send("\n**[BSFR]**\n\nLe fichier que tu as uploadé `" + attachment.filename + "` est infecté \nIl a été supprimé et tu as été muté. \nUn membre du staff te contactera rapidement.")

                        // Delete the warning message after 15 minutes
                        setTimeout(function () {
                            warningMessage.delete()
                        }, 900000)
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

            // Close the SSH connection
            ssh.dispose()
        }
    }
}

module.exports = FileScan;