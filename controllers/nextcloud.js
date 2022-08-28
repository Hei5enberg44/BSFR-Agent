const { NextcloudError } = require('../utils/error')
const { Client, Server, UploadFilesCommand, CommandStatus, Folder } = require('nextcloud-node-client')
const config = require('../config.json')

module.exports = {
    /**
     * Connexion Nextcloud
     * @returns {Client} client Nextcloud
     */
    getClient: function() {
        const server = new Server({
            basicAuth: {
                username: config.nextcloud.username,
                password: config.nextcloud.password
            },
            url: config.nextcloud.url
        })

        const client = new Client(server)

        return client
    },

    /**
     * Upload un fichier dans le Drive
     * @param {string} source chemin du fichier source
     * @param {string} destination chemin du fichier cible
     */
    uploadFile: async function(source, destination) {
        try {
            const client = module.exports.getClient()

            const upload = new UploadFilesCommand(client, {
                files: [
                    {
                        sourceFileName: source,
                        targetFileName: destination
                    }
                ]
            })

            await upload.execute()

            if(upload.getStatus() !== CommandStatus.success) throw new NextcloudError('Impossible d\'uploader le fichier')
        } catch(error) {
            throw new NextcloudError(error.message)
        }
    },

    /**
     * Créer un dossier dans le Drive
     * @param {string} folderName chemin du dossier à créer
     * @returns {Promise<Folder>} dossier créé ou dossier déjà existant
     */
    createFolder: async function(folderName) {
        try {
            const client = module.exports.getClient()

            const folder = await client.getFolder(folderName)

            if(!folder) {
                const newFolder = await client.createFolder(folderName)
                return newFolder
            }

            return folder
        } catch(error) {
            throw new NextcloudError('Une erreur est survenue lors de la création du dossier')
        }
    }
}