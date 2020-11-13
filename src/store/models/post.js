const getPostModel = (sequelize, DataTypes) => {
  const Post = sequelize.define('post', {
    txId: {
      type: DataTypes.STRING(64),
      unique: true
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    subtitle: {
      type: DataTypes.TEXT
    },
    postText: {
      type: DataTypes.TEXT
    },
    timestamp: {
      type: DataTypes.INTEGER
    },
    canonicalLink: {
      type: DataTypes.TEXT
    },
    isDeleted: {
      type: DataTypes.BOOLEAN
    },
    featuredImg: {
      type: DataTypes.STRING
    },
    readRequirement: {
      type: DataTypes.INTEGER
    },
    subscriptionRequirement: {
      type: DataTypes.INTEGER,
      default: 1
    },
    encryptionInfo: {
      type: DataTypes.JSON
    },
    commentCount: {
      type: DataTypes.VIRTUAL,
      get () {
        return this.get('comments')?.length || 0
      }
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

  Post.associate = models => {
    Post.belongsTo(models.user, { onDelete: 'CASCADE' })
    Post.belongsTo(models.community, { onDelete: 'CASCADE' })
    Post.hasMany(models.comment, { onDelete: 'CASCADE' })
  }

  return Post
}

export default getPostModel
