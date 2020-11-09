import { DataSource } from 'apollo-datasource'
import { getConfig } from '3box/lib/api'
import { ethers, BigNumber } from 'ethers'
import { tokenAbi, provider } from '../ethereum'

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
}

export default BalanceApi
