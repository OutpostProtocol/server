import { DataSource } from 'apollo-datasource'
import { User, Community } from '../store/models'

class RoleApi extends DataSource {
  constructor ({ Role }) {
    super()
    this.store = Role
  }

  initialize ({ context } = {}) {
    this.context = context
  }

  async getRoles (ethAddr) {
    const user = await User.findOne({
      where: { address: ethAddr.toLowerCase() }
    })

    if (!user) return []

    return await this.store.findAll({
      where: {
        userId: user.id
      },
      include: [{
        model: Community
      }]
    })
  }
}

export default RoleApi
