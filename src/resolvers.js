import { AuthenticationError } from 'apollo-server-express'
import getPost from './postResolver'
import { hasWriterRole } from './store/user'
import { uploadImageFromBase64 } from './arweave-uploaders/imageUpload'

const resolvers = {
  Query: {
    allCommunities: async (_, __, { dataSources }) => {
      return await dataSources.communities.getAll()
    },
    community: async (_, { slug }, { dataSources }) => {
      return await dataSources.communities.getBySlug(slug)
    },
    posts: async (_, { communitySlug }, { dataSources }) => {
      return await dataSources.posts.getCommunityPosts(communitySlug)
    },
    postPreview: async (_, { txId }, { dataSources }) => {
      return await dataSources.posts.getPost(txId)
    },
    getPost: getPost,
    user: async (_, { ethAddr }, { dataSources }) => {
      return await dataSources.users.getUser(ethAddr)
    },
    userBalance: async (_, { ethAddr, tokenAddress }, { dataSources }) => {
      const { userBalance } = await dataSources.balances.getBalance(ethAddr, tokenAddress)
      return userBalance
    },
    roles: async (_, { ethAddr }, { dataSources }) => {
      return await dataSources.roles.getRoles(ethAddr)
    },
    userRoles: async (_, __, { dataSources, user }) => {
      return await dataSources.roles.getRoles(user.address)
    },
    isNameAvailable: async (_, { name }, { dataSources }) => {
      return await dataSources.users.isNameAvailable(name)
    }
  },
  Mutation: {
    uploadImage: async (_, { image, address }, { dataSources, user }) => {
      if (!user) throw new AuthenticationError('User not authenticated')

      return await uploadImageFromBase64(image, address)
    },
    uploadPost: async (_, { postUpload, communityTxId }, { dataSources, user }) => {
      if (!user) throw new AuthenticationError('User not authenticated')
      if (!(await hasWriterRole(user, communityTxId))) {
        throw new AuthenticationError('User does not has permissions to post')
      }

      return await dataSources.posts.uploadPost(postUpload, user.address, communityTxId)
    },
    uploadComment: async (_, { commentText, postTxId, communityTxId, timestamp }, { dataSources, user }) => {
      if (!user) {
        throw new AuthenticationError('User not authenticated')
      }
      return await dataSources.comments.uploadComment(commentText, postTxId, communityTxId, timestamp, user)
    },
    updateReadRequirement: async (_, { txId, readRequirement }, { dataSources, user }) => {
      if (!user) throw new AuthenticationError('User not authenticated')

      return await dataSources.posts.updateReadRequirement(txId, readRequirement, user)
    },
    deletePost: async (_, { txId }, { dataSources, user }) => {
      if (!user) throw new AuthenticationError('User not authenticated')

      return await dataSources.posts.deletePost(txId, user)
    },
    getSignInToken: async (_, { addr }, { dataSources }) => {
      return await dataSources.users.getSignInToken(addr)
    },
    authAccount: async (_, { signature, addr }, { dataSources }) => {
      return await dataSources.users.authAccount(signature, addr)
    },
    verifyToken: async (_, { token }, { dataSources }) => {
      const verified = await dataSources.users.verifyToken(token)
      return verified.isValid
    }
  }
}

export default resolvers
