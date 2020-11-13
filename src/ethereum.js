import { ethers } from 'ethers'

export const AUTH_TOKEN = 'Outpost needs this signature to authenticate you.\n\nTime: '

export const provider = new ethers.providers.InfuraProvider('goerli', {
  projectId: process.env.INFURA_ID,
  projectSecret: process.env.INFURA_SECRET
})

export const tokenAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

export const validateSig = async ({ address, signature, time }) => {
  const message = AUTH_TOKEN + time
  const messageArr = ethers.utils.arrayify(Buffer.from(message, 'utf8'))

  const recoveredAddr = ethers.utils.verifyMessage(messageArr, signature)

  if (address.toLowerCase() === recoveredAddr.toLowerCase()) {
    return true
  }

  return false
}
