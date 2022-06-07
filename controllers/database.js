const { Sequelize, DataTypes } = require('sequelize')
const { DatabaseError } = require('../utils/error')
const config = require('../config.json')

const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mariadb',
    logging: false
})

const test = async function() {
    try {
        await sequelize.authenticate()
    } catch(error) {
        throw new DatabaseError('Échec de la connexion à la base de données : ' + error.message)
    }
}

const BannedWords = sequelize.define('banned_words', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    word: DataTypes.TEXT,
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE
}, {
    timestamps: false,
    freezeTableName: true
})

const BirthdayMessages = sequelize.define('birthday_messages', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    message: DataTypes.TEXT,
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE
}, {
    timestamps: false,
    freezeTableName: true
})

const MaliciousURL = sequelize.define('malicious_url', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    url: DataTypes.TEXT,
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE
}, {
    timestamps: false,
    freezeTableName: true
})

const Reactions = sequelize.define('reactions', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: DataTypes.STRING(255),
    data: DataTypes.JSON,
    memberId: DataTypes.STRING(255),
    channelId: DataTypes.STRING(255),
    messageId: DataTypes.STRING(255),
    date: DataTypes.DATE
}, {
    timestamps: false,
    freezeTableName: true
})

const Birthdays = sequelize.define('birthdays', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATEONLY
}, {
    timestamps: false,
    freezeTableName: true
})

const Mutes = sequelize.define('mutes', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    mutedBy: DataTypes.STRING(255),
    reason: DataTypes.TEXT,
    unmuteDate: DataTypes.BIGINT
}, {
    timestamps: false,
    freezeTableName: true
})

const Bans = sequelize.define('bans', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    bannedBy: DataTypes.STRING(255),
    approvedBy: DataTypes.STRING(255),
    reason: DataTypes.TEXT,
    unbanDate: DataTypes.BIGINT
}, {
    timestamps: false,
    freezeTableName: true
})

const Threads = sequelize.define('threads', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: DataTypes.STRING(255),
    threadId: DataTypes.STRING(255),
    memberId: DataTypes.STRING(255),
    date: DataTypes.DATE
}, {
    timestamps: false,
    freezeTableName: true
})

const Tweets = sequelize.define('tweets', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    tweet: DataTypes.TEXT
}, {
    timestamps: false,
    freezeTableName: true
})

const YoutubeVideos = sequelize.define('youtube_videos', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    videoId: DataTypes.STRING(255),
    publishedAt: DataTypes.DATE,
    title: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

const FranceCities = sequelize.define('france_cities', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    code_commune_insee: DataTypes.STRING(5),
    nom_de_la_commune: DataTypes.STRING(255),
    code_postal: DataTypes.INTEGER,
    ligne_5: DataTypes.STRING(255),
    libelle_d_acheminement: DataTypes.STRING(255),
    coordonnees_gps: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

const Cities = sequelize.define('cities', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    code_postal: DataTypes.INTEGER,
    nom_de_la_commune: DataTypes.STRING(255),
    coordonnees_gps: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

const Twitch = sequelize.define('twitch', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    memberId: DataTypes.STRING(255),
    channelName: DataTypes.STRING(255),
    live: DataTypes.BOOLEAN,
    messageId: DataTypes.STRING(255)
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = {
    test, BannedWords, BirthdayMessages, MaliciousURL, Reactions, Birthdays, Mutes, Bans, Threads, Tweets, YoutubeVideos, FranceCities, Cities, Twitch
}