import { DataSource } from 'apollo-datasource'
import { Community, Post } from '../store/models'
import { uploadCommentToAR } from '../arweave-uploaders/comment'

class CommentApi extends DataSource {
  constructor ({ Comment }) {
    super()
    this.store = Comment
  }

  initialize ({ context } = {}) {
    this.context = context
  }

  async uploadComment (commentText, postTxId, communityTxId, timestamp, user) {
    const ethAddr = user.address
    const result = await uploadCommentToAR(commentText, postTxId, communityTxId, ethAddr, timestamp)
    if (result.status !== 200) {
      return
    }

    const post = await Post.findOne({
      where: { txId: postTxId },
      include: [{
        model: Community
      }]
    })
    const community = await post.getCommunity()

    const commentModel = await this.store.create({
      communityId: community.id,
      userId: user.id,
      txId: result.tx.txId,
      postText: commentText,
      timestamp,
      isDeleted: false
    })

    await post.addComments(commentModel)
    await post.save()

    const res = {
      ...commentModel.get(),
      user,
      community
    }

    return res
  }
}

export default CommentApi
