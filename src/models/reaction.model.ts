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
import { Locale } from 'discord.js'

export interface BirthdayMessageReactionData {
    id: number
    message: string
    memberId: string
    date: Date
}

export interface MaliciousURLReactionData {
    id: number
    url: string
    memberId: string
    date: Date
}

export interface BanReactionData {
    banId: number
}

export interface PollReactionData {
    pollId: number
}

export type ReactionDataType =
    | BirthdayMessageReactionData[]
    | MaliciousURLReactionData[]
    | BanReactionData
    | PollReactionData

export interface ReactionInteraction {
    locale: Locale
    commandName: string
    memberId: string
    channelId: string
}

@Table({ tableName: 'reactions', freezeTableName: true, timestamps: false })
export class ReactionModel<ReactionDataType> extends Model<
    InferAttributes<ReactionModel<ReactionDataType>>,
    InferCreationAttributes<ReactionModel<ReactionDataType>>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare type: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare data: ReactionDataType

    @Attribute(DataTypes.JSON)
    @NotNull
    declare interaction: Partial<ReactionInteraction>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare messageId: string

    @Attribute(DataTypes.DATE)
    @Default(DataTypes.NOW)
    declare date: CreationOptional<Date>
}
