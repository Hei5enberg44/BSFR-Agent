import { Sequelize } from '@sequelize/core'
import { MariaDbDialect } from '@sequelize/mariadb'
import config from '../../config.json' with { type: 'json' }

import { DatabaseError } from '../utils/error.js'

import { BanModel } from '../models/ban.model.js'
import { BirthdayModel } from '../models/birthday.model.js'
import { BirthdayMessageModel } from '../models/birthdayMessage.model.js'
import { BirthdayWishModel } from '../models/birthdayWish.model.js'
import { BSUpdateModel } from '../models/bsUpdate.model.js'
import { CityModel } from '../models/city.model.js'
import { CooldownModel } from '../models/cooldown.model.js'
import { MaliciousURLModel } from '../models/maliciousUrl.model.js'
import { MuteModel } from '../models/mute.model.js'
import { OldMemberRoleModel } from '../models/oldMemberRole.model.js'
import { PollModel } from '../models/poll.model.js'
import { PollVoteModel } from '../models/pollVote.model.js'
import { QuotaModel } from '../models/quota.model.js'
import { ReactionModel } from '../models/reaction.model.js'
import { RoleModel } from '../models/role.model.js'
import { RoleCategoryModel } from '../models/roleCategory.model.js'
import { SettingModel } from '../models/setting.model.js'
import { ThreadModel } from '../models/thread.model.js'
import { TwitchModel } from '../models/twitch.model.js'
import { YouTubeVideoModel } from '../models/youtubeVideo.model.js'

const sequelize = new Sequelize({
    dialect: MariaDbDialect,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.username,
    password: config.database.password,
    logging: false,
    define: { timestamps: false, freezeTableName: true },
    timezone: 'Europe/Paris',
    models: [
        BanModel,
        BirthdayModel,
        BirthdayMessageModel,
        BirthdayWishModel,
        BSUpdateModel,
        CityModel,
        CooldownModel,
        MaliciousURLModel,
        MuteModel,
        OldMemberRoleModel,
        PollModel,
        PollVoteModel,
        QuotaModel,
        ReactionModel,
        RoleModel,
        RoleCategoryModel,
        SettingModel,
        ThreadModel,
        TwitchModel,
        YouTubeVideoModel
    ]
})

export default {
    async test() {
        try {
            await sequelize.authenticate()
        } catch (error) {
            if (error.name === 'DATABASE_ERROR') {
                throw new DatabaseError(
                    'Échec de la connexion à la base de données : ' +
                        error.message
                )
            }
        }
    }
}
