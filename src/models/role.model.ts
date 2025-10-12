import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    NonAttribute,
    HasOneGetAssociationMixin
} from '@sequelize/core'
import {
    Table,
    Attribute,
    PrimaryKey,
    AutoIncrement,
    NotNull,
    HasOne
} from '@sequelize/core/decorators-legacy'

import { RoleCategoryModel } from './roleCategory.model.js'

@Table({ tableName: 'roles', freezeTableName: true, timestamps: false })
export class RoleModel extends Model<
    InferAttributes<RoleModel>,
    InferCreationAttributes<RoleModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare categoryId: number

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare name: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare nameLocalizations: Record<string, string>

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare multiple: boolean

    @HasOne(() => RoleCategoryModel, {
        foreignKey: 'id',
        sourceKey: 'categoryId'
    })
    declare roleCategory?: NonAttribute<RoleCategoryModel>

    declare getRoleCategory: HasOneGetAssociationMixin<RoleCategoryModel>
}
