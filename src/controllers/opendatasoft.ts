import Logger from '../utils/logger.js'

type DatasetRecordsResults = {
    total_count: number,
    results: DatasetRecordsResult[]
}

type DatasetRecordsResult = {
    name: string,
    country: string,
    coordinates: {
        lat: number,
        lon: number
    }
}

const API_URL = 'https://public.opendatasoft.com/api/explore/v2.1'

const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000))

export default class OpenDataSoft {
    /**
     * Envoi d'une requête à l'API de ScoreSaber
     * @param url url de la requête
     * @param log true|false pour logger la requête
     * @returns résultat de la requête
     */
    private static async send<T>(url: string, log: boolean = true): Promise<T> {
        let data
        let error = false
        let retries = 0

        do {
            if(log) Logger.log('OpenDataSoft', 'INFO', `Envoi de la requête "${url}"`)
            const res = await fetch(url)
            
            if(res.ok) {
                if(log) Logger.log('OpenDataSoft', 'INFO', 'Requête envoyée avec succès')
                data = await res.json()

                error = false
            } else {
                if(res.status === 400) throw Error('Erreur 400 : Requête invalide')
                if(res.status === 404) throw Error('Erreur 404 : Page introuvable')
                if(res.status === 422) throw Error('Erreur 422 : La ressource demandée est introuvable')
                if(res.status === 503) throw Error('Erreur 503 : Service non disponible')
                if(res.status === 500) {
                    Logger.log('OpenDataSoft', 'ERROR', 'Erreur 500, nouvel essai dans 3 secondes')
                    if(retries < 5) await wait(3)
                    retries++
                }
                if(res.status === 429) {
                    Logger.log('OpenDataSoft', 'ERROR', 'Erreur 429, nouvel essai dans 60 secondes')
                    await wait(60)
                }

                error = true
            }
        } while(error)

        return data
    }

    static async getDatasetRecords(datasetId: string, params: Record<string, string>): Promise<DatasetRecordsResults> {
        const urlParams = new URLSearchParams(params).toString()
        const url = `${API_URL}/catalog/datasets/${datasetId}/records?${urlParams}`
        const results = await this.send<DatasetRecordsResults>(url)
        return results
    }
}