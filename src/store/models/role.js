export const WRITER_ROLE = 'WRITER'

const getRoleModel = (sequelize, DataTypes) => {
  const Role = sequelize.define('role', {
    title: {
      type: DataTypes.ENUM({
        values: [WRITER_ROLE]
      })
    }
  })

  Role.associate = models => {
    Role.belongsTo(models.user, { onDelete: 'CASCADE' })
    Role.belongsTo(models.community, { onDelete: 'CASCADE' })
  }

  return Role
}

export default getRoleModel
