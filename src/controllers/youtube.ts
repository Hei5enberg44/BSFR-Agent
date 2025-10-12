import { Client, Guild, TextChannel, roleMention } from 'discord.js'
import { YouTube } from '../controllers/google.js'
import { YouTubeVideoModel } from '../models/youtubeVideo.model.js'
import Logger from '../utils/logger.js'
import config from '../../config.json' with { type: 'json' }

export default {
    /**
     * Publication des nouvelles vidéos de la chaîne YouTube Beat Saber FR
     * dans le salon #youtube
     * @param client client Discord
     */
    async publish(client: Client) {
        try {
            const videos = await YouTubeVideoModel.findAll()
            const latestVideos = await YouTube.getLatestPublicsVideos()

            const newVideos = latestVideos.filter(
                (lv) => !videos.map((v) => v.videoId).includes(lv.videoId)
            )

            Logger.log(
                'YouTube',
                'INFO',
                `${newVideos.length} nouvelle(s) vidéo(s) trouvée(s)`
            )

            for (const newVideo of newVideos) {
                await YouTubeVideoModel.findOrCreate({
                    where: { videoId: newVideo.videoId },
                    defaults: newVideo
                })
            }

            if (newVideos.length > 0) {
                Logger.log(
                    'YouTube',
                    'INFO',
                    'Envoi des vidéos dans le salon #youtube'
                )

                const guild = client.guilds.cache.get(config.guild.id) as Guild
                const youtubeChannel = guild.channels.cache.get(
                    config.guild.channels['youtube']
                ) as TextChannel

                await youtubeChannel.send({
                    content: `${roleMention(config.guild.roles['YouTube'])}\n${newVideos.map((video) => `https://youtu.be/${video.videoId}`).join('\n')}`
                })
            }
        } catch (error) {
            Logger.log(
                'YouTube',
                'ERROR',
                'Erreur lors de la récupération des dernières vidéos'
            )
        }
    }
}
