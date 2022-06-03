const { Cities, FranceCities } = require('./database')

module.exports = {
    /**
     * Ajoute une ville d'origine dans la base de données
     * @param {String} memberId identifiant du membre
     * @param {String} postalCode nom de la ville
     * @param {String} cityName nom de la ville
     */
    set: async function(memberId, postalCode, cityName) {
        const c = await Cities.findOne({ where: { memberId: memberId } })

        if(c) await module.exports.unset(memberId)

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
     * @param {String} memberId identifiant du membre
     */
    unset: async function(memberId) {
        await Cities.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Récupère des villes par rapport à un code postal
     * @param {Number} postalCode code postal de la ville
     * @returns {Promise<Array.<{code_commune_insee: String, nom_de_la_commune: String, code_postal: Number, ligne_5: String, libelle_d_acheminement: String, coordonnees_gps: String}>>} liste des villes
     */
    getCitiesByPostalCode: async function(postalCode) {
        const cities = await FranceCities.findAll({
            where: { code_postal: postalCode },
            group: 'nom_de_la_commune'
        })

        return cities
    }
}