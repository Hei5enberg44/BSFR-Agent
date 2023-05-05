import { Client, TextChannel, roleMention } from 'discord.js'
import { YoutubeAPI } from '../controllers/google.js'
import { YoutubeVideos } from '../controllers/database.js'
import Logger from '../utils/logger.js'
import config from '../config.json' assert { type: 'json' }

export default {
    /**
     * Publication des nouvelles vidéos de la chaîne YouTube Beat Saber FR
     * dans le salon #youtube
     * @param {Client} client client Discord
     */
    async publish(client) {
        try {
            const videos = await YoutubeVideos.findAll()
            const latestVideos = await YoutubeAPI.getLatestPublicsVideos()

            const newVideos = latestVideos.filter(lv => !videos.map(v => v.videoId).includes(lv.videoId))

            Logger.log('YouTube', 'INFO', `${newVideos.length} nouvelle(s) vidéo(s) trouvée(s)`)

            for(const newVideo of newVideos) {
                await YoutubeVideos.findOrCreate({
                    where: { videoId: newVideo.videoId },
                    defaults: newVideo
                })
            }

            if(newVideos.length > 0) {
                Logger.log('YouTube', 'INFO', 'Envoi des vidéos dans le salon #youtube')

                const guild = client.guilds.cache.get(config.guild.id)
                /** @type {TextChannel} */
                const youtubeChannel = guild.channels.cache.get(config.guild.channels['youtube'])

                await youtubeChannel.send({ content: `${roleMention(config.guild.roles['YouTube'])}\n${newVideos.map(video => 'https://youtu.be/' + video.videoId).join('\n')}` })
            }
        } catch(error) {
            Logger.log('YouTube', 'ERROR', 'Erreur lors de la récupération des dernières vidéos')
        }
    }
}