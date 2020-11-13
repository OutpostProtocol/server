import { DataSource } from 'apollo-datasource'
import { getConfig } from '3box/lib/api'
import { ethers, BigNumber } from 'ethers'
import { tokenAbi, provider } from '../ethereum'
import { SubscriptionABI } from 'outpost-subscriptions'

const SUBSCRIPTION_ADDRESS = '0x17C7790a2FC26f792ed4fd7Ffda3C6d4F8441554'

class BalanceApi extends DataSource {
  initialize ({ context } = {}) {
    this.context = context
  }

  async getBalance (userAddr, contractAddress) {
    const token = new ethers.Contract(contractAddress, tokenAbi, provider)

    userAddr = userAddr.toLowerCase()

    let config, balancePromises
    try {
      config = await getConfig(userAddr)

      const addresses = config.links.map(link => {
        if (link.type === 'ethereum-eoa') {
          return link.address
        }
      })

      if (!addresses.includes(userAddr)) addresses.push(userAddr)

      balancePromises = addresses.map(addr => {
        if (addr) return token.balanceOf(addr)

        return null
      })
    } catch (e) {}

    if (!balancePromises) {
      balancePromises = [token.balanceOf(userAddr)]
    }

    const [decimals, tokenSymbol, balances] = await Promise.all([
      token.decimals(),
      token.symbol(),
      balancePromises && Promise.all(balancePromises)
    ])

    const divisor = BigNumber.from(10).pow(decimals)

    let balance = 0
    balances && balances.map(bigNum => {
      if (!bigNum) return
      balance += bigNum.div(divisor).toNumber()
    })

    return {
      userBalance: balance,
      tokenSymbol
    }
  }

  async getSubscription (userAddress) {
    const subContract = new ethers.Contract(SUBSCRIPTION_ADDRESS, SubscriptionABI, provider)

    userAddress = userAddress.toLowerCase()

    console.log(userAddress, 'THE USER ADDRESS')
    const hasSub = await subContract.hasSubscription(userAddress)
    console.log(hasSub, 'WHETHER USER HAS A SUB')
    return hasSub
  }
}

export default BalanceApi
