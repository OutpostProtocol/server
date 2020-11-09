const { wallet, arweave } = require('../arweave')
const dispatchTx = require('./dispatchTx')
const crypto = require('crypto')

async function uploadPostToAR (postData, address, communityTxId) {
  try {
    const { encrypted, key, iv } = encryptPostContent(postData.postText)

    const uploadData = {
      postData: {
        ...postData,
        author: address,
        postText: encrypted
      },
      communityTxId
    }

    const postTx = await arweave.createTransaction({ data: JSON.stringify(uploadData) }, wallet)
    postTx.addTag('App-Name', 'Outpost-Blog')
    postTx.addTag('App-Version', '0.2.0')
    postTx.addTag('Community', communityTxId)

    const { response: postRes } = await dispatchTx(postTx)
    const txData = {
      ...uploadData,
      txId: postTx.id
    }

    return {
      status: postRes.status,
      tx: txData,
      key,
      iv
    }
  } catch (e) {
    console.error(`Arweave Proxy Upload Service Error: ${e}`)
  }
}

async function uploadDeleteTx (txId, communityTxId) {
  try {
    const postTx = await arweave.createTransaction({ data: txId }, wallet)
    postTx.addTag('App-Name', 'Outpost-Delete-Blog')
    postTx.addTag('App-Version', '0.2.0')
    postTx.addTag('Community', communityTxId)
    const { response: postRes } = await dispatchTx(postTx)

    return {
      status: postRes.status,
      txId: postTx.id
    }
  } catch (e) {
    console.error(`Arweave Proxy Upload Service Error: ${e}`)
  }
}

const encryptPostContent = (postContent) => {
  const key = crypto.randomBytes(32)
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv('aes256', key, iv)

  let encrypted = cipher.update(postContent, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return { encrypted, key, iv }
}

module.exports = { uploadPostToAR, uploadDeleteTx }
