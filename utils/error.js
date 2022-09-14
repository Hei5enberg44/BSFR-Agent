const Logger = require('./logger')

class DatabaseError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class CommandError extends Error {
    constructor(message, commandName) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
        Logger.log('CommandManager', 'INFO', `L'exécution de la commande "/${commandName}" a échoué : ${(message).replace(/:[^:]+:\s/g, '').replace('\n', ' ')}`)
    }
}

class CommandInteractionError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class BirthdayMessagesError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class MaliciousURLError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class AntivirusError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class TwitchError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

class NextcloudError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = {
    DatabaseError, CommandError, CommandInteractionError, BirthdayMessagesError, MaliciousURLError, TwitchError, NextcloudError, AntivirusError
}