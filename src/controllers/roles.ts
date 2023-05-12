import { Sequelize } from 'sequelize'
import { RoleModel, RoleCategorieModel } from '../controllers/database.js'

export interface RoleListItem {
    id: string,
    idLocalizations: object,
    categoryName: string,
    categoryNameLocalizations: Record<string, string>,
    roles: RoleItem[]
}

export interface RoleItem {
    id: number,
    name: string,
    nameLocalizations: Record<string, string>,
    multiple: boolean,
    categoryName: string,
    categoryNameLocalizations: Record<string, string>
}

export default class Roles {
    /**
     * Retourne les groupes de rôles depuis la base de données
     * @returns liste des groupes de rôles
     */
    static async list() {
        const roles = <RoleItem[]>await RoleModel.findAll({
            include: [
                {
                    model: RoleCategorieModel,
                    attributes: []
                }
            ],
            attributes: [
                'id',
                'name',
                'nameLocalizations',
                'multiple',
                [ (<Sequelize>RoleCategorieModel.sequelize).literal('`roles_category`.`name`'), 'categoryName' ],
                [ (<Sequelize>RoleCategorieModel.sequelize).literal('`roles_category`.`nameLocalizations`'), 'categoryNameLocalizations' ]
            ],
            raw: true
        })

        const roleList: RoleListItem[] = []
        for(const role of roles) {
            const category = roleList.find(rl => rl.categoryName === role.categoryName)
            if(!category) {
                const idLocalizations: Record<string, string> = {}
                const categoryNameLocalizations = role.categoryNameLocalizations
                Object.keys(categoryNameLocalizations).forEach(c => {
                    idLocalizations[c] = categoryNameLocalizations[c].toLowerCase().replace(/\s/g, '')
                })

                roleList.push({
                    id: idLocalizations['en-US'],
                    idLocalizations: idLocalizations,
                    categoryName: <string>role.categoryName,
                    categoryNameLocalizations: role.categoryNameLocalizations,
                    roles: [ role ]
                })
            } else {
                category.roles.push(role)
            }
        }

        return roleList
    }
}