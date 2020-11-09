import { wallet, arweave } from '../arweave'
import dispatchTx from './dispatchTx'
import showdown from 'showdown'

const converter = new showdown.Converter()

export async function uploadCommentToAR (commentText, postTxId, communityTxId, address, timestamp) {
  try {
    commentText = converter.makeHtml(commentText.replace(/\\/g, '<br/>'))
    const payload = {
      commentData: {
        commentText,
        postTxId,
        timestamp,
        author: address
      },
      communityTxId
    }
    const commentTx = await arweave.createTransaction({ data: JSON.stringify(payload) }, wallet)
    commentTx.addTag('App-Name', 'Outpost-Comment')
    commentTx.addTag('App-Version', '0.2.0')
    commentTx.addTag('Community', communityTxId)

    // TODO: keep trying post until it goes through
    const { response: postRes } = await dispatchTx(commentTx)

    const txData = {
      ...payload,
      txId: commentTx.id
    }

    return {
      status: postRes.status,
      tx: txData
    }
  } catch (e) {
    // TODO: log to mixpanel
    console.log('error!', e)
  }
}
