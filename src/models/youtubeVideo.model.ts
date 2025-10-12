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
    tableName: 'youtube_videos',
    freezeTableName: true,
    timestamps: false
})
export class YouTubeVideoModel extends Model<
    InferAttributes<YouTubeVideoModel>,
    InferCreationAttributes<YouTubeVideoModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare videoId: string

    @Attribute(DataTypes.DATE)
    @NotNull
    declare publishedAt: Date

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare title: string
}
