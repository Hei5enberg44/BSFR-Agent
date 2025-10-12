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

@Table({ tableName: 'quotas', freezeTableName: true, timestamps: false })
export class QuotaModel extends Model<
    InferAttributes<QuotaModel>,
    InferCreationAttributes<QuotaModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare name: string

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare current: number

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare max: number
}
