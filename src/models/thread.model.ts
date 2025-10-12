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

@Table({ tableName: 'threads', freezeTableName: true, timestamps: false })
export class ThreadModel extends Model<
    InferAttributes<ThreadModel>,
    InferCreationAttributes<ThreadModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare type: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare threadId: string

    @Attribute(DataTypes.STRING(255))
    declare memberId: string

    @Attribute(DataTypes.DATE)
    @Default(DataTypes.NOW)
    declare date: CreationOptional<Date>
}
