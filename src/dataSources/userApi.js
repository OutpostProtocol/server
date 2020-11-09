import { DataSource } from 'apollo-datasource'
import Sequelize from 'sequelize'
import { verifyUserToken, getChallengeToken, verifyChallengeAndIssueToken } from '../store/user'

class UserApi extends DataSource {
  constructor ({ User }) {
    super()
    this.store = User
  }

  initialize ({ context } = {}) {
    this.context = context
  }

  async getUser (ethAddr) {
    return await this.store.findOne(
      {
        where: { address: ethAddr.toLowerCase() }
      }
    )
  }

  async getSignInToken (addr) {
    return await getChallengeToken(addr)
  }

  async authAccount (signature, address) {
    return await verifyChallengeAndIssueToken(signature, address)
  }

  async verifyToken (token) {
    return await verifyUserToken(token)
  }

  /**
   * Checks if a name is available
   * @param {String} name being requested
   * @returns if the name is available
   */
  async isNameAvailable (name) {
    const user = await this.store.findOne({
      where: {
        name: {
          [Sequelize.Op.iLike]: `%${name}`
        }
      }
    })
    return user === null
  }
}

export default UserApi
