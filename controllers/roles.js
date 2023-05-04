import { Roles, RolesCategories } from '../controllers/database.js'

export default {
    /**
     * @typedef {Object} Role
     * @property {string} name
     * @property {boolean} multiple
     * 
     */

    /**
     * @typedef {Object} RoleCategory
     * @property {string} category
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
                'id', 'name', 'multiple', [ RolesCategories.sequelize.literal('`roles_category`.`name`'), 'category' ]
            ],
            raw: true
        })

        const roleList = []
        for(const role of roles) {
            const r = { name: role.name, multiple: role.multiple ? true : false }
            const category = roleList.find(rl => rl.category === role.category)
            if(!category) {
                roleList.push({
                    category: role.category,
                    roles: [ r ]
                })
            } else {
                category.roles.push(r)
            }
        }

        return roleList
    }
}