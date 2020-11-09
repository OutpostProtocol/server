import { Model } from 'sequelize'
import { User, Role, Community } from './models'
import { WRITER_ROLE } from './models/role'
import { getConfig } from '3box/lib/api'
import crypto from 'crypto'
import { AUTH_TOKEN, validateSig } from '../ethereum'

const HASH_SECRET = process.env.HASH_SECRET

export interface User {
  id: number
  name?: string
  lastLoginTime: number
  address: string
  hashedValidators: string[]
  createdAt: Date
  updatedAt: Date
}

export interface VerificationResult {
  user: Partial<User>
  isValid: boolean
}

export async function getChallengeToken (address: string): Promise<string> {
  const time = Math.floor(Date.now() / 1000)
  await User.upsert({
    address: address.toLowerCase(),
    lastLoginTime: time
  })

  return `${AUTH_TOKEN}${time}`
}

export async function verifyChallengeAndIssueToken (signature: string, address: string): Promise<string | null> {
  const user = await User.findOne({
    where: {
      address: address.toLowerCase()
    }
  })

  // get time
  const time = user.get('lastLoginTime')

  const validSig = await validateSig({ address, signature, time })
  if (!validSig) {
    return null
  }

  const validator = (await crypto.randomBytes(18)).toString('base64')

  const hmac = crypto.createHmac('sha256', HASH_SECRET).update(validator).digest('base64')

  let validators = user.get('hashedValidators')

  if (validators) {
    validators = [...validators, hmac]
  } else {
    validators = [hmac]
  }

  await user.update({
    hashedValidators: validators
  })

  return `${address}.${validator}`
}

export async function verifyUserToken (token: string): Promise<VerificationResult> {
  try {
    const [address, validator] = token.split('.')

    const hmac = crypto.createHmac('sha256', HASH_SECRET).update(validator).digest('base64')

    const user = await User.findOne({
      where: {
        address: address.toLowerCase()
      }
    })

    if (!user) return { isValid: false, user: null }

    const validators = user.get('hashedValidators')

    let isValid = true

    if (!validators) {
      isValid = false
    }

    if (!validators.includes(hmac)) {
      isValid = false
    }

    return {
      isValid,
      user: {
        ...user.get()
      }
    }
  } catch (e) {
    console.log(e, 'THE ERROR THROWN IN VERIFY USER')
    return {
      isValid: false,
      user: null
    }
  }
}

export async function hasWriterRole (user: Partial<User>, communityTxId: string): Promise<boolean> {
  const com: Model = await Community.findOne({ where: { txId: communityTxId } })

  const role = await Role.findOne({
    where: {
      communityId: com.get('id'),
      userId: user.id
    }
  })

  if (role?.get('title') === WRITER_ROLE) return true

  return false
}

export async function getUserModelFromTable (did: string, userModels: any): Promise<Model> {
  if (userModels[did]) return userModels[did]

  let address
  try {
    address = await getEthAddr(did) || did
  } catch (e) {
    address = did
  }

  const [user] = await User.findCreateFind({
    where: {
      address: address.toLowerCase()
    },
    defaults: {
      address
    }
  })

  userModels[did] = user
  return user
}

async function getEthAddr (did: string): Promise<string> {
  const config = await getConfig(did)

  let i = 0
  for (i; i < config.links.length; i++) {
    const link = config.links[i]
    if (link.type === 'ethereum-eoa') {
      return link.address
    }
  }
}
