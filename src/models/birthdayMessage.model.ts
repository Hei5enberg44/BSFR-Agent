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

@Table({
    tableName: 'birthday_messages',
    freezeTableName: true,
    timestamps: false
})
export class BirthdayMessageModel extends Model<
    InferAttributes<BirthdayMessageModel>,
    InferCreationAttributes<BirthdayMessageModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare message: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.DATE)
    @Default(DataTypes.NOW)
    declare date: CreationOptional<Date>
}
