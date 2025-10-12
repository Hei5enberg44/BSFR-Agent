import Logger from './logger.js'

class ConfigError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CONFIG_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log('Config', 'ERROR', this.message)
    }
}

class DatabaseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'DATABASE_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CommandError extends Error {
    constructor(message: string, commandName: string) {
        super(message)
        this.name = 'COMMAND_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log(
            'CommandManager',
            'ERROR',
            `L'exécution de la commande "/${commandName}" a échoué : ${message.replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`
        )
    }
}

class CommandInteractionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'COMMAND_INTERACTION_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class ModalError extends Error {
    constructor(message: string, modalName: string) {
        super(message)
        this.name = 'MODAL_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log(
            'ModalManager',
            'ERROR',
            `La soumission de la modale "${modalName}" a échoué : ${message.replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`
        )
    }
}

class ModalSubmissionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'MODAL_SUBMISSION_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class ButtonError extends Error {
    constructor(message: string, buttonName: string) {
        super(message)
        this.name = 'BUTTON_ERROR'
        Error.captureStackTrace(this, this.constructor)
        Logger.log(
            'ButtonManager',
            'ERROR',
            `La soumission du bouton "${buttonName}" a échoué : ${message.replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`
        )
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
    constructor() {
        super()
        this.name = 'BIRTHDAY_MESSAGE_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class MaliciousURLEmptyError extends Error {
    constructor() {
        super()
        this.name = 'MALICIOUS_URL_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class AntivirusError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ANTIVIRUS_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class TwitchError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'TWITCH_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class NextcloudError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NEXTCLOUD_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class CooldownEmptyError extends Error {
    constructor() {
        super()
        this.name = 'COOLDOWN_EMPTY_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

class QuotaLimitError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'QUOTA_LIMIT_ERROR'
        Error.captureStackTrace(this, this.constructor)
    }
}

export {
    ConfigError,
    DatabaseError,
    CommandError,
    CommandInteractionError,
    ModalError,
    ModalSubmissionError,
    ButtonError,
    PageNotFoundError,
    BirthdayMessageEmptyError,
    MaliciousURLEmptyError,
    TwitchError,
    NextcloudError,
    AntivirusError,
    CooldownEmptyError,
    QuotaLimitError
}
