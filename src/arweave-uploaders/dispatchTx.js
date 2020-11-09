const { wallet, arweave } = require('../arweave')
const { retryWithBackoff } = require('promises-tho')

async function dispatchTx (tx) {
  const anchorId = await arweave.api.get('/tx_anchor').then(x => x.data)
  tx.last_tx = anchorId

  // Sign and dispatch the TX, forwarding the response code as our own.
  await arweave.transactions.sign(tx, wallet)

  const postTx = retryWithBackoff(
    { tries: 4, startMs: 1000 },
    (postTx) => arweave.transactions.post(postTx)
  )

  const response = await postTx(tx)
  const gateway = arweave.api.config.host

  const output = `Transaction ${tx.get('id')} dispatched to ` +
                  `${gateway} with response: ${response.status}.`
  console.log(output)

  return {
    response,
    gateway
  }
}

module.exports = dispatchTx
