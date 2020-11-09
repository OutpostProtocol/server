import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import { json } from 'body-parser'
import helmet from 'helmet'
import cors from 'cors'
import fileUpload from 'express-fileupload'
import chalk from 'chalk'

import typeDefs from './schema'
import resolvers from './resolvers'
import CommunityApi from './dataSources/communityApi'
import CommentApi from './dataSources/commentAPI'
import PostApi from './dataSources/postApi'
import UserApi from './dataSources/userApi'
import BalanceApi from './dataSources/balanceApi'
import RoleApi from './dataSources/roleApi'
import { dbHandler } from './store'
import { Community, Post, User, Comment, Role } from './store/models'
import setContext from './context'
import runner from './runner'
import relay from './relay';

(async () => {
  await dbHandler.startDB()

  runner()

  console.log(chalk.white`✨ All models were synchronized...`)

  const dataSources = () => ({
    communities: new CommunityApi({ Community }),
    posts: new PostApi({ Post }),
    users: new UserApi({ User }),
    comments: new CommentApi({ Comment }),
    balances: new BalanceApi(),
    roles: new RoleApi({ Role })
  })

  const schema = {
    typeDefs,
    resolvers,
    dataSources,
    cors: {
      origin: true
    },
    introspection: true,
    context: setContext,
    playground: true
  }

  const server = new ApolloServer(schema)

  const app = express()
    .use(json({ limit: '1mb' }))
    .use(fileUpload())
    .use(helmet())
    .use(cors())
    .use('/relay', relay())

  server.applyMiddleware({ app, path: '/graphql' })

  const port = process.env.PORT || 4000

  const { url } = await new Promise(
    resolve => app.listen({ port }, resolve)
  ).then(() => ({ url: `http://localhost:${port}` }))

  console.log(chalk.green.bold`🚀 Server running at ${url}!`)
})()
