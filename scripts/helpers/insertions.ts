import { Community, User, Role } from '../../src/store/models'
import { WRITER_ROLE } from '../../src/store/models/role'
import { getComId } from '.'

export interface User {
  address: string
  image?: string
  name?: string
}

export interface Community {
  txId: string
  tokenAddress?: string
  imageTxId: string
  tokenSymbol?: string
  defaultReadRequirement?: number
  description: string
  name: string
  slug: string
  showOwner?: boolean
}

export async function addPublication (user: User, com: Community) {
  user.address = user.address.toLowerCase()
  const [owner] = await User.upsert(user)

  const txId = getComId(com.txId)

  const [communityModel] = await Community.upsert({
    ...com,
    txId,
    ownerId: owner.id
  })

  await Role.upsert({
    userId: owner.id,
    communityId: communityModel.id,
    title: WRITER_ROLE
  })
}

export async function addWriter (address: String, image: String, name: String, txId: String) {
  const community = await Community.findOne({
    where: { txId }
  })

  if (!community) throw Error(`Can not find community with txId ${txId}`)

  const user = await User.upsert({
    address: address.toLowerCase(),
    image,
    name
  })

  if (!user) throw Error(`Can not find user with address ${address}`)

  await Role.upsert({
    userId: user.id,
    communityId: community.id,
    title: WRITER_ROLE
  })
}
