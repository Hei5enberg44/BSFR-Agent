import { CitieModel, FranceCitieModel } from './database.js'

export default {
    /**
     * Ajoute une ville d'origine dans la base de données
     * @param memberId identifiant du membre
     * @param postalCode nom de la ville
     * @param cityName nom de la ville
     */
    async set(memberId: string, postalCode: string, cityName: string) {
        const memberCity = await CitieModel.findOne({ where: { memberId: memberId } })

        if(memberCity) await this.unset(memberId)

        const city = await FranceCitieModel.findOne({
            where: {
                code_postal: postalCode,
                nom_de_la_commune: cityName
            },
            group: 'nom_de_la_commune'
        })

        if(city) {
            await CitieModel.create({
                memberId: memberId,
                code_postal: city.code_postal,
                nom_de_la_commune: city.nom_de_la_commune,
                coordonnees_gps: city.coordonnees_gps
            })
        }
    },

    /**
     * Supprime une ville d'origine de la base de données
     * @param memberId identifiant du membre
     */
    async unset(memberId: string) {
        await CitieModel.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Récupère des villes par rapport à un code postal
     * @param postalCode code postal de la ville
     * @returns liste des villes
     */
    async getCitiesByPostalCode(postalCode: number) {
        const cities = await FranceCitieModel.findAll({
            where: { code_postal: postalCode },
            group: 'nom_de_la_commune'
        })
        return cities
    }
}