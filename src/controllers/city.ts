import opendatasoft from './opendatasoft.js'
import { CityModel } from '../models/city.model.js'

export default {
    /**
     * Ajoute une ville d'origine dans la base de données
     * @param memberId identifiant du membre
     * @param postalCode nom de la ville
     * @param cityName nom de la ville
     */
    async set(
        memberId: string,
        countryName: string,
        cityName: string,
        latitude: string,
        longitude: string
    ) {
        await this.unset(memberId)

        await CityModel.create({
            memberId: memberId,
            country: countryName,
            city: cityName,
            coordinates: `${latitude},${longitude}`
        })
    },

    /**
     * Supprime une ville d'origine de la base de données
     * @param memberId identifiant du membre
     */
    async unset(memberId: string) {
        await CityModel.destroy({
            where: { memberId: memberId }
        })
    },

    /**
     * Récupère des villes en fonction d'un nom de ville
     * @param cityName nom de la ville
     * @returns liste des villes
     */
    async getCitiesByName(cityName: string) {
        const params = {
            select: 'name, cou_name_en AS country, coordinates',
            where: `name LIKE \'%${cityName.replace("'", "\\'")}%\'`,
            include_links: 'false',
            include_app_metas: 'false',
            offset: '0',
            limit: '50'
        }
        const cities = await opendatasoft.getDatasetRecords(
            'geonames-all-cities-with-a-population-1000',
            params
        )
        return cities.results
    }
}
