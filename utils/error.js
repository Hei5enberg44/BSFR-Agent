import Logger from './logger.js'

class DatabaseError extends Error {
    constructor(message) {
        super(message)
        this.name = 'DATABASE_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CommandError extends Error {
    constructor(message, commandName) {
        super(message)
        this.name = 'COMMAND_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('CommandManager', 'INFO', `L'exécution de la commande "/${commandName}" a échoué : ${(message).replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`)
    }
}

class CommandInteractionError extends Error {
    constructor(message) {
        super(message)
        this.name = 'COMMAND_INTERACTION_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class PageNotFoundError extends Error {
    constructor() {
        super()
        this.name = 'PAGE_NOT_FOUND_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class BirthdayMessageEmptyError extends Error {
    constructor(message) {
        super(message)
        this.name = 'BIRTHDAY_MESSAGE_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class MaliciousURLEmptyError extends Error {
    constructor(message) {
        super(message)
        this.name = 'MALICIOUS_URL_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class AntivirusError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ANTIVIRUS_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class TwitchError extends Error {
    constructor(message) {
        super(message)
        this.name = 'TWITCH_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class NextcloudError extends Error {
    constructor(message) {
        super(message)
        this.name = 'NEXTCLOUD_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CooldownEmptyError extends Error {
    constructor(message) {
        super(message)
        this.name = 'COOLDOWN_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class QuotaLimitError extends Error {
    constructor(message) {
        super(message)
        this.name = 'QUOTA_LIMIT_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

export {
    DatabaseError,
    CommandError,
    CommandInteractionError,
    PageNotFoundError,
    BirthdayMessageEmptyError,
    MaliciousURLEmptyError,
    TwitchError,
    NextcloudError,
    AntivirusError,
    CooldownEmptyError,
    QuotaLimitError
}