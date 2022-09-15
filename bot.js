import { Client, GatewayIntentBits, Partials } from 'discord.js'
import Commands from './controllers/commands.js'
import Events from './controllers/events.js'
import crons from './controllers/crons.js'
import Logger from './utils/logger.js'
import { DatabaseError } from './utils/error.js'
import database from './controllers/database.js'
import * as fs from 'node:fs'

try {
    Logger.log('Application', 'INFO', 'Démarrage du bot')

    // Création du répertoire de logs si celui-ci n'existe pas
    if(!fs.existsSync('./logs')) fs.mkdirSync('./logs')

    // Chargement de la configuration du bot
    if(!fs.existsSync('./config.json')) throw Error('Le fichier de configuration "config.json" est manquant')
    const { default: config } = await import('./config.json', { assert: { type: 'json' } })

    Logger.log('Discord', 'INFO', 'Initialisation...')

    const client = new Client({
        intents: [
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildBans,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.MessageContent
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction
        ]
    })

    client.once('ready', async () => {
        Logger.log('Discord', 'INFO', 'Initialisation terminée')

        // Test de la connexion à la base de données
        try {
            Logger.log('Database', 'INFO', 'Connexion à la base de données...')
            await database.test()
            Logger.log('Database', 'INFO', 'Connexion à la base de données réussie')
        } catch(error) {
            if(error instanceof DatabaseError) {
                Logger.log('Database', 'ERROR', error.message)
                process.exit(1)
            }
        }

        const guild = client.guilds.cache.get(config.guild.id)
        await guild.members.fetch()
        await guild.channels.fetch()
        await guild.roles.fetch()
    
        // Chargement des commandes
        const commands = new Commands(client)
        await commands.load()
        await commands.listen()

        // Chargement des évènements
        const events = new Events(client)
        await events.load()

        // Tâches planifiées
        await crons.birthdayWish(client)
        await crons.unmute(client)
        await crons.unban(client)
        await crons.publish(client)
        await crons.live(client)
        await crons.checkBSUpdate(client)
        await crons.finishPolls(client)
    
        Logger.log('Application', 'INFO', 'Le bot est prêt !')
    })
    
    client.login(config.token)
} catch(error) {
    Logger.log('Application', 'ERROR', `Démarrage du bot impossible : ${error.message}`)
}