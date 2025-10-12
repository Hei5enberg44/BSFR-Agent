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

@Table({ tableName: 'bs_updates', freezeTableName: true, timestamps: false })
export class BSUpdateModel extends Model<
    InferAttributes<BSUpdateModel>,
    InferCreationAttributes<BSUpdateModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.BLOB('medium'))
    declare image: Buffer | null

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare title: string

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare content: string
}
