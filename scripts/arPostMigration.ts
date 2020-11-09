import { arweave } from '../src/arweave'
import PostApi from '../src/dataSources/postApi'
import { fetchNewTxIds } from '../src/runner/fetchTxs'
import crypto from 'crypto'
import { dbHandler } from '../src/store'
import { Post, Community } from '../src/store/models'
import yargs = require('yargs')

const argv = yargs.options({
  oldId: { type: 'string', demandOption: true },
  newId: { type: 'string', demandOption: true },
  author: { type: 'string', demandOption: true },
  readRequirement: { type: 'number', demandOption: true }
}).argv

const { oldId, author, readRequirement } = argv
let { newId } = argv

if (process.env.NODE_ENV === 'development') {
  newId = `${newId}:development`
} else if (process.env.NODE_ENV === 'staging') {
  newId = `${newId}:staging`
}

const resizedIV = Buffer.allocUnsafe(16)
const iv = crypto
  .createHash('sha256')
  .update('myHashedIV') // TODO: set random, post specific iv for posts
  .digest()

iv.copy(resizedIV)

const ENCRYPTION_PHRASE = process.env.ENCRYPTION_PHRASE

const OLD_KEY = crypto.createHash('sha256').update(ENCRYPTION_PHRASE).digest('base64').substr(0, 32)

const migratePosts = async () => {
  await dbHandler.startDB()

  // check the community exists
  const com = await Community.findOne({ where: { txId: newId } })
  if (!com) throw new Error(`No community exists with txId "${newId}"`)

  const postApi = new PostApi({ Post })

  const networkInfo = await arweave.network.getInfo()
  const endHeight = networkInfo.height

  const txInfos = await fetchNewTxIds(arweave, 'Outpost-Blog', oldId, endHeight, 531639)

  for (let i = 0; i < txInfos.length; i++) {
    const tx = txInfos[i].node

    const encryptedPayload = await arweave.transactions.getData(tx.id, { decode: true, string: true }) as string

    const decipher = crypto.createDecipheriv('aes256', OLD_KEY, resizedIV)
    let payload = decipher.update(encryptedPayload, 'base64', 'utf8')
    payload += decipher.final('utf8')

    const postInfo = JSON.parse(payload)

    if (!postInfo) {
      console.log(`Skipping tx with missing or invalid jwt - ${txInfos[i].id}`)
      continue
    }

    const uploadData = {
      title: postInfo.postData.title,
      subtitle: postInfo.postData.subtitle,
      postText: postInfo.postData.postText,
      timestamp: postInfo.time,
      featuredImg: postInfo.featuredImg,
      readRequirement
    }

    await postApi.uploadPost(uploadData, author, newId)
  }
}

migratePosts()
  .then(() => console.log('success'))
  .catch(e => console.error(e))
