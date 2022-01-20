const { Client } = require('discord.js')
const { roleMention } = require('@discordjs/builders')
const gapi = require('../controllers/google')
const { YoutubeVideos } = require('../controllers/database')
const Logger = require('../utils/logger')
const config = require('../config.json')

module.exports = {
    /**
     * Publication des nouvelles vidéos de la chaîne YouTube Beat Saber FR
     * dans le channel #youtube
     * @param {Client} client client Discord
     */
    publish: async function(client) {
        const videos = await YoutubeVideos.findAll()
        const latestVideos = await gapi.getYoutubeLatestPublicsVideos()

        const newVideos = latestVideos.filter(lv => !videos.map(v => v.videoId).includes(lv.videoId))

        Logger.log('YouTube', 'INFO', `${newVideos.length} nouvelle(s) vidéo(s) trouvée(s)`)

        for(const newVideo of newVideos) {
            await YoutubeVideos.findOrCreate({
                where: { videoId: newVideo.videoId },
                defaults: newVideo
            })
        }

        if(newVideos.length > 0) {
            Logger.log('YouTube', 'INFO', `Envoi des vidéos dans le channel #youtube`)

            const guild = client.guilds.cache.get(config.guild.id)
            const youtubeChannel = guild.channels.cache.get(config.guild.channels.youtube)

            await youtubeChannel.send({ content: `${roleMention(config.guild.roles['YouTube'])}\n${newVideos.map(video => 'https://youtu.be/' + video.videoId).join('\n')}` })
        }
    }
}