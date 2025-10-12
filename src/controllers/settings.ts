import { SettingModel } from '../models/setting.model.js'

export default class Settings {
    static async get(name: string) {
        const setting = await SettingModel.findOne({
            where: {
                name
            }
        })
        if (setting) {
            return setting.data
        }
        return null
    }
}
