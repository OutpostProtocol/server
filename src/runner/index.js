import { syncCommunity } from './syncCommunity'
import { arweave } from '../arweave'
import { Community } from '../store/models'

const isShuttingDown = false

const randomDelayBetween = (minSeconds, maxSeconds) => {
  const randomDelay = Math.random() * (maxSeconds - minSeconds)
  const ms = (minSeconds + randomDelay) * 1000
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runner () {
  // eslint-disable-next-line
  while (!isShuttingDown) {
    try {
      await syncAll()
    } catch (error) {
      console.error(`runner error: ${error}`)
    }

    await randomDelayBetween(10, 20)
  }
}

async function syncAll () {
  const communities = await Community.findAll()

  const syncPromises = communities.map(com =>
    syncCommunity(arweave, com.get('txId')))

  await Promise.all(syncPromises)
}

export default runner
