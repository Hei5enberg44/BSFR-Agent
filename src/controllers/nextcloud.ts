import { NextcloudError } from '../utils/error.js'
import {
    Client,
    Server,
    UploadFilesCommand,
    CommandStatus,
    Folder
} from 'nextcloud-node-client'
import config from '../../config.json' with { type: 'json' }

export default class Nextcloud {
    /**
     * Connexion Nextcloud
     * @returns client Nextcloud
     */
    static getClient(): Client {
        const server = new Server({
            basicAuth: {
                username: config.nextcloud.username,
                password: config.nextcloud.password
            },
            url: config.nextcloud.url
        })

        const client = new Client(server)

        return client
    }

    /**
     * Upload un fichier dans le Drive
     * @param source chemin du fichier source
     * @param destination chemin du fichier cible
     */
    static async uploadFile(source: string, destination: string) {
        try {
            const client = this.getClient()

            const upload = new UploadFilesCommand(client, {
                files: [
                    {
                        sourceFileName: source,
                        targetFileName: destination
                    }
                ]
            })

            await upload.execute()

            if (upload.getStatus() !== CommandStatus.success)
                throw new NextcloudError("Impossible d'uploader le fichier")
        } catch (error) {
            throw new NextcloudError(error.message)
        }
    }

    /**
     * Créer un dossier dans le Drive
     * @param folderName chemin du dossier à créer
     * @returns dossier créé ou dossier déjà existant
     */
    static async createFolder(folderName: string): Promise<Folder> {
        try {
            const client = this.getClient()

            const folder = await client.getFolder(folderName)

            if (!folder) {
                const newFolder = await client.createFolder(folderName)
                return newFolder
            }

            return folder
        } catch (error) {
            throw new NextcloudError(
                'Une erreur est survenue lors de la création du dossier'
            )
        }
    }
}
