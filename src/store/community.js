import { Community } from './models'

export async function findCommunity (txId, state) {
  const com = await Community.findOne({
    where: {
      txId
    }
  })

  if (com.state === null) {
    await com.update({
      txId,
      state: JSON.stringify(state)
    })
  }

  return com
}

export async function initCommunity (txId, parentId = null, defaults = {}) {
  // check if the community already exists
  const existingCom = await Community.findOne({
    where: {
      txId
    }
  })

  if (existingCom) {
    return existingCom
  }

  return await Community.create({
    txId,
    ...defaults
  })
}
