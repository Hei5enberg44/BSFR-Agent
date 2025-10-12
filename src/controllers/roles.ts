import { RoleCategoryModel } from '../models/roleCategory.model.js'

export interface RoleListItem {
    id: string
    idLocalizations: object
    categoryName: string
    categoryNameLocalizations: Record<string, string>
    roles: RoleItem[]
}

export interface RoleItem {
    id: number
    name: string
    nameLocalizations: Record<string, string>
    multiple: boolean
    categoryName: string
    categoryNameLocalizations: Record<string, string>
}

export default class Roles {
    /**
     * Retourne les groupes de rôles depuis la base de données
     * @returns liste des groupes de rôles
     */
    static async list() {
        const roleCategories = await RoleCategoryModel.findAll()
        const roleList: RoleListItem[] = []
        for (const roleCategory of roleCategories) {
            const idLocalizations: Record<string, string> = {}
            const categoryNameLocalizations = roleCategory.nameLocalizations
            Object.keys(categoryNameLocalizations).forEach((c) => {
                idLocalizations[c] = categoryNameLocalizations[c]
                    .toLowerCase()
                    .replace(/\s/g, '')
            })
            const roles = await roleCategory.getRoles()
            roleList.push({
                id: idLocalizations['en-US'],
                idLocalizations: idLocalizations,
                categoryName: roleCategory.name,
                categoryNameLocalizations: roleCategory.nameLocalizations,
                roles: roles.map((r) => {
                    return {
                        id: r.id,
                        name: r.name,
                        nameLocalizations: r.nameLocalizations,
                        multiple: r.multiple,
                        categoryName: roleCategory.name,
                        categoryNameLocalizations:
                            roleCategory.nameLocalizations
                    }
                })
            })
        }
        return roleList
    }
}
