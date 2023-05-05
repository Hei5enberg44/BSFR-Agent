import { Roles, RolesCategories } from '../controllers/database.js'

export default {
    /**
     * @typedef {Object} Role
     * @property {string} name
     * @property {Object<string, string>} nameLocalizations
     * @property {boolean} multiple
     * 
     */

    /**
     * @typedef {Object} RoleCategory
     * @property {string} id
     * @property {Object<string, string>} idLocalizations
     * @property {string} categoryName
     * @property {Object<string, string>} categoryNameLocalizations
     * @property {Array<Role>} roles
     */

    /**
     * Retourne les groupes de rôles depuis la base de données
     * @returns {Promise<Array<RoleCategory>>} liste des groupes de rôles
     */
    async list() {
        const roles = await Roles.findAll({
            include: [
                {
                    model: RolesCategories,
                    attributes: []
                }
            ],
            attributes: [
                'id',
                'name',
                'nameLocalizations',
                'multiple',
                [ RolesCategories.sequelize.literal('`roles_category`.`name`'), 'categoryName' ],
                [ RolesCategories.sequelize.literal('`roles_category`.`nameLocalizations`'), 'categoryNameLocalizations' ]
            ],
            raw: true
        })

        const roleList = []
        for(const role of roles) {
            const r = { name: role.name, nameLocalizations: role.nameLocalizations, multiple: role.multiple ? true : false }
            const category = roleList.find(rl => rl.categoryName === role.categoryName)
            if(!category) {
                Object.keys(role.categoryNameLocalizations).forEach(c => {
                    role.categoryNameLocalizations[c] = role.categoryNameLocalizations[c].toLowerCase().replace(/\s/g, '')
                })

                roleList.push({
                    id: role.categoryNameLocalizations['en-US'],
                    idLocalizations: role.categoryNameLocalizations,
                    categoryName: role.categoryName,
                    categoryNameLocalizations: role.categoryNameLocalizations,
                    roles: [ r ]
                })
            } else {
                category.roles.push(r)
            }
        }

        return roleList
    }
}