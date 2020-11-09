const getUserModel = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set (addr) {
        this.setDataValue('address', addr.toLowerCase())
      }
    },
    image: {
      type: DataTypes.STRING
    },
    lastLoginTime: { // auth users prev login
      type: DataTypes.INTEGER
    },
    hashedValidators: { // validate cookie from previous login
      type: DataTypes.ARRAY(DataTypes.STRING)
    }
  },
  {
    indexes: [{
      unique: true,
      fields: ['address']
    }]
  })

  User.associate = models => {
    User.hasMany(models.role, { onDelete: 'CASCADE' })
  }

  return User
}

export default getUserModel
