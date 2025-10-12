import {
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional
} from '@sequelize/core'
import {
    Table,
    Attribute,
    PrimaryKey,
    AutoIncrement,
    NotNull
} from '@sequelize/core/decorators-legacy'

@Table({ tableName: 'settings', freezeTableName: true, timestamps: false })
export class SettingModel extends Model<
    InferAttributes<SettingModel>,
    InferCreationAttributes<SettingModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare name: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare data: Record<string, any>
}
