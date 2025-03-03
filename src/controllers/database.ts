import { LocaleString } from 'discord.js'
import { Sequelize, DataTypes, Model, CreationOptional, InferAttributes, InferCreationAttributes, NonAttribute } from 'sequelize'
import { DatabaseError } from '../utils/error.js'
import config from '../config.json' with { type: 'json' }

const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mariadb',
    logging: false,
    define: {
        timestamps: false,
        freezeTableName: true
    },
    timezone: 'Europe/Paris'
})

export default {
    async test() {
        try {
            await sequelize.authenticate()
        } catch(error) {
            if(error.name === 'DATABASE_ERROR') {
                throw new DatabaseError('Échec de la connexion à la base de données : ' + error.message)
            }
        }
    }
}

interface BirthdayMessageModel extends Model<InferAttributes<BirthdayMessageModel>, InferCreationAttributes<BirthdayMessageModel>> {
    id: CreationOptional<number>,
    message: string,
    memberId: string,
    date: CreationOptional<Date>
}

const BirthdayMessageModel = sequelize.define<BirthdayMessageModel>('birthday_messages', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    message: DataTypes.TEXT(),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

interface BirthdayWishesModel extends Model<InferAttributes<BirthdayWishesModel>, InferCreationAttributes<BirthdayWishesModel>> {
    id: CreationOptional<number>,
    birthdayMessageId: number
}

const BirthdayWishesModel = sequelize.define<BirthdayWishesModel>('birthday_wishes', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    birthdayMessageId: DataTypes.INTEGER()
})

interface MaliciousURLModel extends Model<InferAttributes<MaliciousURLModel>, InferCreationAttributes<MaliciousURLModel>> {
    id: CreationOptional<number>,
    url: string,
    memberId: string,
    date: CreationOptional<Date>
}

const MaliciousURLModel = sequelize.define<MaliciousURLModel>('malicious_url', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    url: DataTypes.TEXT(),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

interface BirthdayMessageReactionData {
    id: number,
    message: string,
    memberId: string,
    date: Date
}

interface MaliciousURLReactionData {
    id: number,
    url: string,
    memberId: string,
    date: Date
}

interface BanReactionData {
    banId: number
}

interface PollReactionData {
    pollId: number
}

type ReactionDataType = BirthdayMessageReactionData[] | MaliciousURLReactionData[] | BanReactionData | PollReactionData

interface ReactionInteraction {
    locale: LocaleString,
    commandName: string,
    memberId: string,
    channelId: string
}

interface ReactionModel<ReactionDataType> extends Model<InferAttributes<ReactionModel<ReactionDataType>>, InferCreationAttributes<ReactionModel<ReactionDataType>>> {
    id: CreationOptional<number>,
    type: string,
    data: ReactionDataType,
    interaction: Partial<ReactionInteraction>,
    messageId: string,
    date: CreationOptional<Date>
}

const ReactionModel = sequelize.define<ReactionModel<ReactionDataType>>('reactions', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    type: DataTypes.STRING(255),
    data: DataTypes.JSON(),
    interaction: DataTypes.JSON(),
    messageId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

interface BirthdayModel extends Model<InferAttributes<BirthdayModel>, InferCreationAttributes<BirthdayModel>> {
    id: CreationOptional<number>,
    memberId: string,
    date: Date
}

const BirthdayModel = sequelize.define<BirthdayModel>('birthdays', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATEONLY()
})

interface MuteModel extends Model<InferAttributes<MuteModel>, InferCreationAttributes<MuteModel>> {
    id: CreationOptional<number>,
    memberId: string,
    mutedBy: string,
    reason: string,
    muteDate: Date,
    unmuteDate: Date
}

const MuteModel = sequelize.define<MuteModel>('mutes', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    mutedBy: DataTypes.STRING(255),
    reason: DataTypes.TEXT(),
    muteDate: DataTypes.DATE(),
    unmuteDate: DataTypes.DATE()
})

interface BanModel extends Model<InferAttributes<BanModel>, InferCreationAttributes<BanModel>> {
    id: CreationOptional<number>,
    memberId: string,
    bannedBy: string,
    approvedBy: string | null,
    reason: string,
    banDate: Date | null,
    unbanDate: Date
}

const BanModel = sequelize.define<BanModel>('bans', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    bannedBy: DataTypes.STRING(255),
    approvedBy: DataTypes.STRING(255),
    reason: DataTypes.TEXT(),
    banDate: DataTypes.DATE(),
    unbanDate: DataTypes.DATE()
})

interface ThreadModel extends Model<InferAttributes<ThreadModel>, InferCreationAttributes<ThreadModel>> {
    id: CreationOptional<number>,
    type: string,
    threadId: string,
    memberId: string,
    date: CreationOptional<Date>
}

const ThreadModel = sequelize.define<ThreadModel>('threads', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    type: DataTypes.STRING(255),
    threadId: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

interface YouTubeVideoModel extends Model<InferAttributes<YouTubeVideoModel>, InferCreationAttributes<YouTubeVideoModel>> {
    id: CreationOptional<number>,
    videoId: string,
    publishedAt: Date,
    title: string
}

const YouTubeVideoModel = sequelize.define<YouTubeVideoModel>('youtube_videos', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    videoId: DataTypes.STRING(255),
    publishedAt: DataTypes.DATE(),
    title: DataTypes.STRING(255)
})

interface FranceCitieModel extends Model<InferAttributes<FranceCitieModel>, InferCreationAttributes<FranceCitieModel>> {
    id: CreationOptional<number>,
    code_commune_insee: string,
    nom_de_la_commune: string,
    code_postal: number,
    ligne_5: string,
    libelle_d_acheminement: string,
    coordonnees_gps: string
}

const FranceCitieModel = sequelize.define<FranceCitieModel>('france_cities', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    code_commune_insee: DataTypes.STRING(5),
    nom_de_la_commune: DataTypes.STRING(255),
    code_postal: DataTypes.INTEGER(),
    ligne_5: DataTypes.STRING(255),
    libelle_d_acheminement: DataTypes.STRING(255),
    coordonnees_gps: DataTypes.STRING(255)
})

interface CitieModel extends Model<InferAttributes<CitieModel>, InferCreationAttributes<CitieModel>> {
    id: CreationOptional<number>,
    memberId: string,
    pays: string,
    commune: string,
    coordonnees_gps: string
}

const CitieModel = sequelize.define<CitieModel>('cities', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    pays: DataTypes.STRING(255),
    commune: DataTypes.STRING(255),
    coordonnees_gps: DataTypes.STRING(255)
})

interface TwitchModel extends Model<InferAttributes<TwitchModel>, InferCreationAttributes<TwitchModel>> {
    id: CreationOptional<number>,
    memberId: string,
    channelName: string,
    live: boolean,
    messageId: string
}

const TwitchModel = sequelize.define<TwitchModel>('twitch', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    channelName: DataTypes.STRING(255),
    live: DataTypes.BOOLEAN(),
    messageId: DataTypes.STRING(255)
})

interface BSUpdateModel extends Model<InferAttributes<BSUpdateModel>, InferCreationAttributes<BSUpdateModel>> {
    id: CreationOptional<number>,
    image?: Buffer | null,
    title: string,
    content: string
}

const BSUpdateModel = sequelize.define<BSUpdateModel>('bs_updates', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    image: {
        type: DataTypes.BLOB(),
        allowNull: true
    },
    title: DataTypes.TEXT(),
    content: DataTypes.TEXT()
})

interface PollModel extends Model<InferAttributes<PollModel>, InferCreationAttributes<PollModel>> {
    id: CreationOptional<number>,
    title: string,
    propositions: string[],
    emojis: string[],
    dateEnd: Date,
    createdBy: string,
    channelId: string,
    messageId: string
}

const PollModel = sequelize.define<PollModel>('polls', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    title: DataTypes.STRING(255),
    propositions: DataTypes.JSON(),
    emojis: DataTypes.JSON(),
    dateEnd: DataTypes.DATE(),
    createdBy: DataTypes.STRING(255),
    channelId: DataTypes.STRING(255),
    messageId: DataTypes.STRING(255)
})

interface PollVoteModel extends Model<InferAttributes<PollVoteModel>, InferCreationAttributes<PollVoteModel>> {
    id: CreationOptional<number>,
    pollId: number,
    memberId: string,
    vote: string
}

const PollVoteModel = sequelize.define<PollVoteModel>('polls_votes', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    pollId: DataTypes.INTEGER(),
    memberId: DataTypes.STRING(255),
    vote: DataTypes.STRING(255)
})

interface RoleModel extends Model<InferAttributes<RoleModel>, InferCreationAttributes<RoleModel>> {
    id: CreationOptional<number>,
    categoryId: number,
    name: string,
    nameLocalizations: object,
    multiple: boolean,
    categoryName?: NonAttribute<string>,
    categoryNameLocalizations?: NonAttribute<object>
}

const RoleModel = sequelize.define<RoleModel>('roles', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    categoryId: DataTypes.INTEGER(),
    name: DataTypes.STRING(255),
    nameLocalizations: DataTypes.JSON(),
    multiple: DataTypes.BOOLEAN()
})

interface RoleCategorieModel extends Model<InferAttributes<RoleCategorieModel>, InferCreationAttributes<RoleCategorieModel>> {
    id: CreationOptional<number>,
    name: string,
    nameLocalizations: object
}

const RoleCategorieModel = sequelize.define<RoleCategorieModel>('roles_categories', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING(255),
    nameLocalizations: DataTypes.JSON()
})

RoleModel.hasOne(RoleCategorieModel, {
    foreignKey: 'id',
    sourceKey: 'categoryId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

interface CooldownModel extends Model<InferAttributes<CooldownModel>, InferCreationAttributes<CooldownModel>> {
    id: CreationOptional<number>,
    memberId: string,
    timeThreshold: number,
    countThreshold: number,
    muteDuration: number,
    messageDate: CreationOptional<Date> | null,
    count: CreationOptional<number>
}

const CooldownModel = sequelize.define<CooldownModel>('cooldowns', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    timeThreshold: DataTypes.INTEGER(),
    countThreshold: DataTypes.INTEGER(),
    muteDuration: DataTypes.INTEGER(),
    messageDate: DataTypes.DATE(),
    count: DataTypes.INTEGER()
})

interface QuotaModel extends Model<InferAttributes<QuotaModel>, InferCreationAttributes<QuotaModel>> {
    id: CreationOptional<number>,
    name: string,
    current: number,
    max: number
}

const QuotaModel = sequelize.define<QuotaModel>('quotas', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING(255),
    current: DataTypes.INTEGER(),
    max: DataTypes.INTEGER()
})

interface OldMemberRole {
    id: string,
    name: string
}

interface OldMemberRolesModel extends Model<InferAttributes<OldMemberRolesModel>, InferCreationAttributes<OldMemberRolesModel>> {
    id: CreationOptional<number>,
    memberId: string,
    roles: OldMemberRole[]
}

const OldMemberRolesModel = sequelize.define<OldMemberRolesModel>('old_member_roles', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    roles: DataTypes.JSON()
})

interface SettingsModel extends Model<InferAttributes<SettingsModel>, InferCreationAttributes<SettingsModel>> {
    id: CreationOptional<number>,
    name: string,
    data: Record<string, any>
}

const SettingsModel = sequelize.define<SettingsModel>('settings', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING(255),
    data: DataTypes.JSON()
})

export {
    BirthdayMessageModel,
    BirthdayWishesModel,
    MaliciousURLModel,
    ReactionModel,
    ReactionDataType,
    BirthdayMessageReactionData,
    MaliciousURLReactionData,
    BanReactionData,
    PollReactionData,
    ReactionInteraction,
    BirthdayModel,
    MuteModel,
    BanModel,
    ThreadModel,
    YouTubeVideoModel,
    FranceCitieModel,
    CitieModel,
    TwitchModel,
    BSUpdateModel,
    PollModel,
    PollVoteModel,
    RoleModel,
    RoleCategorieModel,
    CooldownModel,
    QuotaModel,
    OldMemberRolesModel,
    SettingsModel
}