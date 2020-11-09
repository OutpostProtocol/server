import Arweave from 'arweave/node'
import { Model } from 'sequelize'
import { Community, Post } from '../store/models'
import { getUserModelFromTable } from '../store/user'
import debug from 'debug'
import crypto from 'crypto'
import { fetchNewTxIds } from './fetchTxs'

const log = debug('runner:postSync')

interface PostInfo {
  txId: string
  communityTxId: string
  transactionId: number
  postData?: PostData
  author?: string
  time?: number
  featuredImg?: string
  key: any
  iv: any
  isEdited: boolean
}

interface PostData {
  title: string
  subtitle: string
  postText: string
  author: string
  timestamp: number
  canonicalLink?: string
  originalTxId?: string
  isDeleted?: boolean
  featuredImg?: string
  readRequirement?: number
}

const logPostError = debug('runner:logPostError')

async function syncDeletions (arweave: Arweave, communityTxId: string, endHeight: number, startHeight: number) {
  const txInfos = await fetchNewTxIds(arweave, 'Outpost-Delete-Blog', communityTxId, endHeight, startHeight)
  log(`Found ${txInfos.length} deletions`)
  const deleteTxIds: String[] = []
  for (let i = 0; i < txInfos.length; i++) {
    const tx = txInfos[i].node
    try {
      const payload = await arweave.transactions.getData(tx.id, { decode: true, string: true }) as string
      const txId = payload
      deleteTxIds.push(txId)
    } catch (e) {
      console.log(tx.id, 'THE ID OF THE TRANSACTION')
      console.log(communityTxId, 'THE COMMUNITY TX ID')
      console.log(e, 'ERROR FETCHING AND DECRYPTING')
      continue
    }
  }
  return deleteTxIds
}

export async function syncPosts (arweave: Arweave, communityTxId: string, endHeight: number, startHeight: number) {
  const txInfos = await fetchNewTxIds(arweave, 'Outpost-Blog', communityTxId, endHeight, startHeight)

  const ignoreTxIds: String[] = await syncDeletions(arweave, communityTxId, endHeight, startHeight)
  log(`Found ${txInfos.length} new posts`)
  const newPosts: PostInfo[] = []
  for (let i = 0; i < txInfos.length; i++) {
    const tx = txInfos[i].node
    if (ignoreTxIds.includes(tx.id)) continue
    try {
      const payload = await arweave.transactions.getData(tx.id, { decode: true, string: true }) as string
      const postInfo = JSON.parse(payload)

      const post = await Post.findOne({ where: { txId: tx.id } })
      if (post) {
        const encryptionKeys = getEncryptionKey(post, tx.id)
        postInfo.key = encryptionKeys?.key
        postInfo.iv = encryptionKeys?.iv
      }

      if (!postInfo) {
        logPostError(`Skipping tx with missing or invalid jwt - ${txInfos[i].id}`)
        continue
      }
      newPosts.push({
        ...postInfo,
        txId: tx.id
      })
    } catch (e) {
      console.log(tx.id, 'THE TX ID THAT CAUSED ERROR')
      console.log(e, 'ERROR FETCHING AND DECRYPTING')
      continue
    }
  }
  await savePosts(newPosts)
}

async function savePosts (newPosts: PostInfo[]) {
  const userModels = {}
  const postRecords = []
  const editedPosts = []

  const sortedPosts = newPosts.sort((a, b) => {
    return Number(a.postData.timestamp) - Number(b.postData.timestamp)
  })

  for (const post of sortedPosts) {
    const user = await getUserModelFromTable(post?.author || post.postData.author, userModels)
    const community = await Community.findOne({
      where: {
        txId: post.communityTxId
      }
    })

    const hasKeys = post.key && post.iv
    if (hasKeys) {
      try {
        post.postData.postText = decryptPost(post.postData.postText, post.key, post.iv)
      } catch (e) {
        console.error("Can't decrypt, have keys, wait for edit")
      }
    } else if (!post.postData.originalTxId) continue // no keys, not an edit, skip

    if (post.postData?.originalTxId) { // edit post
      editedPosts.push({
        txId: post.txId,
        timestamp: post.postData.timestamp,
        originalTxId: post.postData.originalTxId,
        editedPost: post.postData
      })
    } else if (post.postData) { // add post
      postRecords.push(createPostRecord(post, community, user))
    }
  }

  await Post.bulkCreate(postRecords, {
    updateOnDuplicate: [
      'title', 'subtitle', 'communityId', 'postText',
      'canonicalLink', 'timestamp', 'featuredImg', 'userId', 'isDeleted'
    ]
  })

  for (const { originalTxId, editedPost, txId } of editedPosts) {
    await updatePost(originalTxId, editedPost, txId)
  }
}

function decryptPost (postText: any, key: Buffer, iv: Buffer) {
  const decipher = crypto.createDecipheriv('aes256', key, iv)
  let postContent = decipher.update(postText, 'base64', 'utf8')
  postContent += decipher.final('utf8')

  return postContent
}

function createPostRecord (post: PostInfo, community: any, user: any) {
  const record = {
    txId: post.txId,
    title: post.postData.title,
    userId: user.get('id'),
    communityId: community.get('id'),
    postText: post.postData.postText,
    subtitle: post.postData.subtitle,
    canonicalLink: post.postData.canonicalLink,
    timestamp: post?.time || post.postData.timestamp,
    featuredImg: post?.featuredImg || post.postData?.featuredImg,
    readRequirement: post.postData?.readRequirement,
    isDeleted: false
  }

  return record
}

async function updatePost (originalTxId: string, editedPost: PostData, editTx: string) {
  const originalPost = await Post.findOne({
    where: {
      txId: originalTxId
    }
  })

  if (originalPost === null) {
    console.error('Could not edit the post with txId: ', originalTxId)
    return
  }
  const encryptionInfo = getEncryptionKey(originalPost, editTx)
  let text = originalPost.get('postText')
  if (encryptionInfo) {
    try {
      text = decryptPost(editedPost.postText, encryptionInfo.key, encryptionInfo.iv)
    } catch (e) {
      console.error(e)
      console.log(`Error thrown decrypting edit in tx ${editTx}`)
    }
  }

  await originalPost.update({
    title: editedPost.title,
    subtitle: editedPost.subtitle,
    postText: text,
    canonicalLink: editedPost.canonicalLink,
    featuredImg: editedPost.featuredImg
  })
  await originalPost.save()
}

function getEncryptionKey (post: Model, txId: String) {
  const encryptionKeys = JSON.parse(post.get('encryptionInfo') as string)
  if (!encryptionKeys) return undefined
  const values = encryptionKeys[txId.toString()]
  const key = Buffer.from(values?.key.data)
  const iv = Buffer.from(values?.iv.data)
  return { key, iv }
}
