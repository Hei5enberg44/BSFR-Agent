import { Cities, FranceCities } from './database.js'

export default {
    /**
     * Ajoute une ville d'origine dans la base de données
     * @param {string} memberId identifiant du membre
     * @param {string} postalCode nom de la ville
     * @param {string} cityName nom de la ville
     */
    async set(memberId, postalCode, cityName) {
        const c = await Cities.findOne({ where: { memberId: memberId } })

        if(c) await this.unset(memberId)

        const city = await FranceCities.findOne({
            where: {
                code_postal: postalCode,
                nom_de_la_commune: cityName
            },
            group: 'nom_de_la_commune'
        })

        await Cities.create({
            memberId: memberId,
            code_postal: city.code_postal,
            nom_de_la_commune: city.nom_de_la_commune,
            coordonnees_gps: city.coordonnees_gps
        })
    },

    /**
     * Supprime une ville d'origine de la base de données
     * @param {string} memberId identifiant du membre
     */
    async unset(memberId) {
        await Cities.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * @typedef {Object} City
     * @property {string} code_commune_insee
     * @property {string} nom_de_la_commune
     * @property {number} code_postal
     * @property {string} ligne_5
     * @property {string} libelle_d_acheminement
     * @property {string} coordonnees_gps
     */

    /**
     * Récupère des villes par rapport à un code postal
     * @param {number} postalCode code postal de la ville
     * @returns {Promise<Array<City>>} liste des villes
     */
    async getCitiesByPostalCode(postalCode) {
        const cities = await FranceCities.findAll({
            where: { code_postal: postalCode },
            group: 'nom_de_la_commune'
        })

        return cities
    }
}