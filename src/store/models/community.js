const getComModel = (sequelize, DataTypes) => {
  const Community = sequelize.define('community', {
    txId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false
    },
    state: {
      type: DataTypes.TEXT
    },
    lastBlockSynced: {
      type: DataTypes.INTEGER
    },
    contractSrc: {
      type: DataTypes.TEXT
    },
    name: {
      type: DataTypes.STRING
    },
    imageTxId: {
      type: DataTypes.STRING
    },
    tokenAddress: {
      type: DataTypes.STRING
    },
    tokenSymbol: {
      type: DataTypes.STRING
    },
    defaultReadRequirement: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.TEXT
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    showOwner: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['txId']
      }
    ]
  })

  Community.associate = models => {
    Community.belongsTo(models.user, {
      onDelete: 'CASCADE',
      as: 'owner'
    })
  }

  return Community
}

export default getComModel
