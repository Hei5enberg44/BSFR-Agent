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

@Table({ tableName: 'polls', freezeTableName: true, timestamps: false })
export class PollModel extends Model<
    InferAttributes<PollModel>,
    InferCreationAttributes<PollModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare title: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare propositions: string[]

    @Attribute(DataTypes.JSON)
    @NotNull
    declare emojis: string[]

    @Attribute(DataTypes.DATE)
    @NotNull
    declare dateEnd: Date

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare createdBy: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare channelId: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare messageId: string
}
