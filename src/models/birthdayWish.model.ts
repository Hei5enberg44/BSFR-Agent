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

@Table({
    tableName: 'birthday_wishes',
    freezeTableName: true,
    timestamps: false
})
export class BirthdayWishModel extends Model<
    InferAttributes<BirthdayWishModel>,
    InferCreationAttributes<BirthdayWishModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.INTEGER)
    @NotNull
    declare birthdayMessageId: number
}
