import Sequelize, { DataTypes } from 'sequelize'
import getComModel from './community'
import getUserModel from './user'
import getPostModel from './post'
import getCommentModel from './comment'
import getRoleModel from './role'
import debug from 'debug'

const log = debug('db')

const DATABASE_URL = process.env.DATABASE_URL

class DbHandler {
  constructor (dialectOptions) {
    this.db = new Sequelize(DATABASE_URL, {
      logging: log,
      dialect: 'postgres',
      dialectOptions
    })

    this.comModel = getComModel(this.db, DataTypes)
    this.userModel = getUserModel(this.db, DataTypes)
    this.postModel = getPostModel(this.db, DataTypes)
    this.commentModel = getCommentModel(this.db, DataTypes)
    this.roleModel = getRoleModel(this.db, DataTypes)

    // create associations
    Object.values(this.db.models).forEach(model => {
      if ('associate' in model) {
        model.associate(this.db.models)
      }
    })
  }

  startDB = async (force = false) => {
    try {
      await this.db.authenticate()
    } catch (e) {
      console.error('Error connecting to database: ', e)
      process.exit()
    }

    if (process.env.RESET_TXS === 'yes') {
      await this.resetTables()
    }

    await this.db.sync({ force })
  }

  resetTables = async () => {
    await this.commentModel.drop({ cascade: true })

    const posts = await this.postModel.findAll()
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      await post.update({
        subtitle: null,
        postText: null,
        timestamp: null,
        canonicalLink: null,
        isDeleted: null,
        featuredImg: null,
        readRequirement: null
      })
    }

    const communities = await this.comModel.findAll()
    for (let i = 0; i < communities.length; i++) {
      const com = communities[i]
      await com.update({ lastBlockSynced: 0 })
    }
  }

  getModels = () => {
    return {
      Community: this.comModel,
      User: this.userModel,
      Post: this.postModel,
      Comment: this.commentModel,
      Role: this.roleModel
    }
  }
}

const dialectOptions = process.env.DB_REJECT_UNAUTHORIZED === 'NO'
  ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
  : {}

const dbHandler = new DbHandler(dialectOptions)
const { Community, User, Post, Comment, Role } = dbHandler.getModels()

export {
  dbHandler,
  Community,
  User,
  Post,
  Comment,
  Role
}
