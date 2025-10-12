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
    NotNull,
    Default
} from '@sequelize/core/decorators-legacy'

@Table({ tableName: 'malicious_url', freezeTableName: true, timestamps: false })
export class MaliciousURLModel extends Model<
    InferAttributes<MaliciousURLModel>,
    InferCreationAttributes<MaliciousURLModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare url: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.DATE)
    @Default(DataTypes.NOW)
    declare date: CreationOptional<Date>
}
