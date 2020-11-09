import { DataSource } from 'apollo-datasource'
import { AuthenticationError } from 'apollo-server-express'
import { User, Community, Comment } from '../store/models'
import { uploadPostToAR, uploadDeleteTx } from '../arweave-uploaders/blogPost'

class PostApi extends DataSource {
  constructor ({ Post }) {
    super()
    this.store = Post
  }

  initialize ({ context } = {}) {
    this.context = context
  }

  async getPost (txId) {
    const post = await this.store.findOne({
      include: [{
        model: User
      },
      {
        model: Community
      },
      {
        model: Comment,
        include: [
          {
            model: User
          }
        ]
      }],
      where: {
        txId: txId
      }
    })

    return post
  }

  async getCommunityPosts (communitySlug) {
    const com = await Community.findOne({
      where: {
        slug: communitySlug
      }
    })

    const posts = await this.store.findAll({
      include: [{
        model: User
      },
      {
        model: Community
      }],
      where: {
        communityId: com.id,
        isDeleted: false
      },
      order: [
        ['timestamp', 'DESC']
      ]
    })

    return posts
  }

  async uploadPost (postData, ethAddr, communityTxId) {
    if (!postData.featuredImg) postData.featuredImg = getFeaturedImage(postData.postText)

    const result = await uploadPostToAR(postData, ethAddr, communityTxId)

    const {
      title,
      subtitle,
      postText,
      canonicalLink,
      featuredImg,
      originalTxId,
      timestamp,
      readRequirement
    } = postData

    if (result.status !== 200) {
      return
    }

    const community = await Community.findOne({
      where: { txId: communityTxId }
    })

    const user = await User.findOne({
      where: { address: ethAddr.toLowerCase() }
    })

    const encryptionInfo = {
      [result.tx.txId]: {
        key: result.key,
        iv: result.iv
      }
    }

    let postModel
    if (originalTxId) {
      postModel = await this.updatePost(originalTxId, postData, postText, encryptionInfo)
    } else {
      postModel = await this.store.create({
        txId: result.tx.txId,
        communityId: community.id,
        userId: user.id,
        title,
        subtitle,
        postText,
        timestamp,
        canonicalLink,
        featuredImg,
        readRequirement,
        isDeleted: false,
        encryptionInfo: JSON.stringify(encryptionInfo)
      })
    }

    const res = {
      ...postModel.get(),
      user: user.get(),
      community: community.get()
    }

    return res
  }

  async updateReadRequirement (txId, readRequirement, user) {
    const post = await this.store.findOne({
      where: { txId },
      include: [{
        model: User
      }]
    })

    const author = await post.getUser()
    if (author.address !== user.address) {
      throw new AuthenticationError('Only authors can change the token price')
    }

    post.readRequirement = readRequirement
    await post.save()
    return true
  }

  async updatePost (originalTxId, editedPost, postText, newKeys) {
    const originalPost = await this.store.findOne({
      where: {
        txId: originalTxId
      }
    })

    if (originalPost === null) {
      console.error('Could not find the original post with txId: ', originalTxId)
      return
    }

    const existingKeys = JSON.parse(originalPost.get('encryptionInfo'))
    const updatedKeys = {
      ...existingKeys,
      ...newKeys
    }

    await originalPost.update({
      title: editedPost.title,
      subtitle: editedPost.subtitle,
      postText: postText,
      canonicalLink: editedPost.canonicalLink,
      encryptionInfo: JSON.stringify(updatedKeys)
    })
    await originalPost.save()

    return originalPost
  }

  async deletePost (txId, user) {
    const post = await this.store.findOne({
      where: {
        txId: txId
      },
      include: [{
        model: Community
      }, {
        model: User
      }]
    })

    if (user.address !== post.user.address) throw new AuthenticationError('Only the author can delete the post.')

    const com = await post.getCommunity()
    const res = await uploadDeleteTx(txId, com.txId)
    if (res.status === 200 && post) {
      await post.update({
        title: '',
        subtitle: '',
        postText: '',
        canonicalLink: '',
        isDeleted: true
      })
      await post.save()
      return true
    }
    return false
  }
}

function getFeaturedImage (postText) {
  const imgRegex = /<img[^>]+src="http([^">]+)/

  if (!postText.match(imgRegex)) return

  const featuredImg = postText.match(imgRegex)[0].split(/src="/)[1]
  return featuredImg
}

export default PostApi
