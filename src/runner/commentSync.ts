import Arweave from 'arweave/node'
import { Post, Comment, Community } from '../store/models'
import { fetchNewTxIds } from './fetchTxs'
import { getUserModelFromTable } from '../store/user'
import debug from 'debug'

const log = debug('runner:commentSync')
const logCommentError = debug('runner:commentError')

interface CommentInfo {
  time: number
  txId: string
  communityTxId: string
  transactionId: number
  commentData: CommentData
}

interface CommentData {
  commentText: string
  postTxId: string
  author: string
  timestamp: number
}

export async function syncComments (arweave: Arweave, communityTxId: string, endHeight: number, startHeight: number) {
  const txInfos = await fetchNewTxIds(arweave, 'Outpost-Comment', communityTxId, endHeight, startHeight)

  log(`Found ${txInfos.length} new comments`)
  const newComments: CommentInfo[] = []
  for (let i = 0; i < txInfos.length; i++) {
    const tx = txInfos[i].node

    const payload = await arweave.transactions.getData(tx.id, { decode: true, string: true }) as string
    const commentInfo = JSON.parse(payload)

    if (!commentInfo) {
      logCommentError(`Skipping tx with missing or invalid jwt - ${txInfos[i].id}`)
      continue
    }

    newComments.push({
      ...commentInfo,
      txId: tx.id
    })
  }

  await saveComments(newComments)
}

async function saveComments (newComments: CommentInfo[]) {
  const userModels = {}
  const commentRecords = []
  for (const comment of newComments) {
    const user = await getUserModelFromTable(comment.commentData.author, userModels)
    const community = await Community.findOne({
      where: {
        txId: comment.communityTxId
      }
    })
    commentRecords.push([createCommentRecord(comment, community, user), comment.commentData.postTxId])
  }
  for (const [record, postTxId] of commentRecords) {
    const [comment, created] = await Comment.findOrCreate({
      where: { txId: record.txId }
    })
    if (created) {
      await comment.update(record)
      await createPostAssociations(comment, postTxId)
    }
  }
}

function createCommentRecord (comment: CommentInfo, community: any, user: any) {
  return {
    txId: comment.txId,
    userId: user.get('id'),
    transactionId: comment.transactionId,
    communityId: community.get('id'),
    postText: comment.commentData.commentText,
    timestamp: comment.commentData.timestamp,
    isDeleted: false
  }
}

async function createPostAssociations (comment: any, postTxId: String) {
  const post = await Post.findOne({
    where: { txId: postTxId }
  })

  if (!post) {
    console.error('Cant add comment to post with txId', postTxId)
    return
  }

  await post.addComments(comment)
  await post.save()
}
