const getCommentModel = (sequelize, DataTypes) => {
  const Comment = sequelize.define('comment', {
    txId: {
      type: DataTypes.STRING(64),
      unique: true
    },
    postText: {
      type: DataTypes.TEXT
    },
    timestamp: {
      type: DataTypes.INTEGER
    },
    isDeleted: {
      type: DataTypes.BOOLEAN
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

  Comment.associate = models => {
    Comment.belongsTo(models.community, { onDelete: 'CASCADE' })
    Comment.belongsTo(models.user, { onDelete: 'CASCADE' })
  }

  return Comment
}

export default getCommentModel
