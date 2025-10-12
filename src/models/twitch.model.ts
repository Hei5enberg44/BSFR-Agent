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

@Table({ tableName: 'twitch', freezeTableName: true, timestamps: false })
export class TwitchModel extends Model<
    InferAttributes<TwitchModel>,
    InferCreationAttributes<TwitchModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare channelName: string

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    declare live: boolean

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare messageId: string
}
