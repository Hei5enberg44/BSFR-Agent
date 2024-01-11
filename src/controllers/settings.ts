import { SettingsModel } from '../controllers/database.js'

export default class Settings {
    static async get(name: string) {
        const setting = await SettingsModel.findOne({
            where: {
                name
            }
        })
        if(setting) {
            return setting.data
        }
        return null
    }
}