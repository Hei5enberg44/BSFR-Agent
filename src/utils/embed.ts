import { EmbedBuilder, EmbedData } from 'discord.js'
import config from '../config.json' assert { type: 'json' }

export default class Embed extends EmbedBuilder {
    constructor(data?: EmbedData) {
        super(data)
        this.setFooter({ text: `${config.appName} ${config.appVersion}`, iconURL: config.appLogo })
    }
}