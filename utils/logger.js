import { appendFileSync } from 'node:fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
    /**
     * Retourne la date actuelle
     */
    date() {
        const d = new Date()
        const year = d.getFullYear()
        const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1
        const date = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate()
        const hours = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours()
        const minutes = d.getMinutes() < 10 ? `0${d.getMinutes()}` : d.getMinutes()
        const seconds = d.getSeconds() < 10 ? `0${d.getSeconds()}` : d.getSeconds()

        return {
            date: `${year}-${month}-${date}`,
            time: `${hours}:${minutes}:${seconds}`
        }
    },

    /**
     * Redirige les logs vers un fichier horodaté
     * Les logs sont ensuite retournés dans la console
     * @param {string} scope provenance du log
     * @param {string} level niveau de log (INFO, WARNING, ERROR)
     * @param {string} content log à formatter
     * @returns {string} logs formattées
     */
    log(scope, level, content) {
        const date = this.date()

        const _scope = chalk.blackBright(scope)
        const _date = `${chalk.yellow(date.date)} ${chalk.yellow(date.time)}`

        let _level
        switch(level) {
            case 'INFO':
                _level = chalk.blueBright(level)
                break
            case 'WARNING':
                _level = chalk.yellowBright(level)
                break
            case 'ERROR':
                _level = chalk.redBright(level)
                break
            default:
                _level = chalk.blueBright(level)
        }

        appendFileSync(`${__dirname}/../logs/${date.date}.log`, `[${date.date} ${date.time}] [${scope}] [${level}] ${content}\n`)
        console.log(`[${_date}] [${_scope}] [${_level}] ${content}`)
    }
}