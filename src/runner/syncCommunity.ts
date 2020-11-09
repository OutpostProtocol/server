import Arweave from 'arweave/node'
import { Model } from 'sequelize'
import { syncContract } from 'smartweave'
import { Community } from '../store/models'
import { syncPosts } from './postSync'
import { syncComments } from './commentSync'
import debug from 'debug'

const log = debug('runner:syncCommunity')

export async function syncCommunity (arweave: Arweave, contractTxId: string) {
  const com = await Community.findOne({
    where: {
      txId: contractTxId
    }
  })

  const prevBlock = com.get('lastBlockSynced') as number

  const networkInfo = await arweave.network.getInfo()
  const endHeight = networkInfo.height

  if (prevBlock >= endHeight) {
    log(`Community ${contractTxId} is synced.`)
  }

  // await runContractSync(arweave, com, ipfs, endHeight)

  // sync the posts
  await syncPosts(arweave, contractTxId, endHeight, prevBlock + 1)
  await syncComments(arweave, contractTxId, endHeight, prevBlock + 1)

  await com.update({
    lastBlockSynced: endHeight
  })
}

async function runContractSync (arweave: Arweave, com: Model, ipfs: object, endHeight: number) {
  const prevBlock = com.get('lastBlockSynced') as number
  const state = JSON.parse(com.get('state') as string)
  const contractSrc = com.get('contractSrc') as string
  const contractTxId = com.get('txId') as string

  const syncOptions = {
    startHeight: prevBlock + 1,
    endHeight,
    state,
    contractSrc,
    dependencies: {
      ipfs
    }
  }

  const syncedInfo = await syncContract(arweave, contractTxId, syncOptions)

  await com.update({
    state: JSON.stringify(syncedInfo.state),
    lastBlockSynced: endHeight,
    contractSrc: syncedInfo.contractSrc
  })
}
