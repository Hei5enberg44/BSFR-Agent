import { Sequelize, DataTypes } from 'sequelize'
import { DatabaseError } from '../utils/error.js'
import config from '../config.json' assert { type: 'json' }

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
            throw new DatabaseError('Échec de la connexion à la base de données : ' + error.message)
        }
    }
}

const BirthdayMessages = sequelize.define('birthday_messages', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    message: DataTypes.TEXT(),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

const MaliciousURL = sequelize.define('malicious_url', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    url: DataTypes.TEXT(),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

const Reactions = sequelize.define('reactions', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    type: DataTypes.STRING(255),
    data: DataTypes.JSON(),
    memberId: DataTypes.STRING(255),
    channelId: DataTypes.STRING(255),
    messageId: DataTypes.STRING(255),
    date: DataTypes.DATE()
})

const Birthdays = sequelize.define('birthdays', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATEONLY()
})

const Mutes = sequelize.define('mutes', {
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

const Bans = sequelize.define('bans', {
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

const Threads = sequelize.define('threads', {
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

const YoutubeVideos = sequelize.define('youtube_videos', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    videoId: DataTypes.STRING(255),
    publishedAt: DataTypes.DATE(),
    title: DataTypes.STRING(255)
})

const FranceCities = sequelize.define('france_cities', {
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

const Cities = sequelize.define('cities', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    code_postal: DataTypes.INTEGER(),
    nom_de_la_commune: DataTypes.STRING(255),
    coordonnees_gps: DataTypes.STRING(255)
})

const Twitch = sequelize.define('twitch', {
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

const BSUpdates = sequelize.define('bs_updates', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    image: DataTypes.BLOB(),
    title: DataTypes.TEXT(),
    content: DataTypes.TEXT()
})

const Polls = sequelize.define('polls', {
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

const PollsVotes = sequelize.define('polls_votes', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    pollId: DataTypes.INTEGER(),
    memberId: DataTypes.STRING(255),
    vote: DataTypes.STRING(255)
})

const Roles = sequelize.define('roles', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    categoryId: DataTypes.INTEGER(),
    name: DataTypes.STRING(255),
    multiple: DataTypes.BOOLEAN()
})

const RolesCategories = sequelize.define('roles_categories', {
    id: {
        type: DataTypes.INTEGER(),
        autoIncrement: true,
        primaryKey: true
    },
    name: DataTypes.STRING(255)
})

Roles.hasOne(RolesCategories, {
    foreignKey: 'id',
    sourceKey: 'categoryId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

export {
    BirthdayMessages, MaliciousURL, Reactions, Birthdays, Mutes, Bans, Threads, YoutubeVideos, FranceCities, Cities, Twitch, BSUpdates, Polls, PollsVotes, Roles, RolesCategories
}