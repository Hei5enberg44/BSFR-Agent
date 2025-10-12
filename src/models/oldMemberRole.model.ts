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

interface OldMemberRole {
    id: string
    name: string
}

@Table({
    tableName: 'old_member_roles',
    freezeTableName: true,
    timestamps: false
})
export class OldMemberRoleModel extends Model<
    InferAttributes<OldMemberRoleModel>,
    InferCreationAttributes<OldMemberRoleModel>
> {
    @Attribute(DataTypes.INTEGER)
    @PrimaryKey
    @AutoIncrement
    declare id: CreationOptional<number>

    @Attribute(DataTypes.STRING(255))
    @NotNull
    declare memberId: string

    @Attribute(DataTypes.JSON)
    @NotNull
    declare roles: OldMemberRole[]
}
