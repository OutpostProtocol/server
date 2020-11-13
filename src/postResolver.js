import { AuthenticationError } from 'apollo-server-express'

const getPost = async (_, { txId }, { dataSources, user }) => {
  if (!txId) return

  const postInfo = await dataSources.posts.getPost(txId)
  const { tokenAddress } = postInfo.community
  const { readRequirement } = postInfo
  const comments = postInfo.comments

  if (!tokenAddress || !readRequirement) {
    return {
      post: {
        ...postInfo.get()
      },
      comments
    }
  }

  if (!user) {
    throw new AuthenticationError('User not authenticated')
  }
  const ethAddr = user.address

  const hasSubscription = await dataSources.balances.getSubscription(ethAddr)

  let postText = null
  if (hasSubscription || postInfo.user.address === ethAddr) {
    postText = postInfo.postText
  }

  return {
    post: {
      ...postInfo.get(),
      postText
    },
    comments,
    hasSubscription,
    tokenAddress,
    readRequirement
  }
}

export default getPost
