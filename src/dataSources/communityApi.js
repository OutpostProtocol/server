import { DataSource } from 'apollo-datasource'
import { User } from '../store/models'
import { initCommunity } from '../store/community'

class CommunityApi extends DataSource {
  constructor ({ Community }) {
    super()
    this.store = Community
  }

  initialize ({ context } = {}) {
    this.context = context
  }

  async getAll () {
    return await this.store.findAll({
      order: [
        ['tokenAddress', 'ASC']
      ],
      include: [{ model: User, as: 'owner' }]
    })
  }

  async getBySlug (slug) {
    const com = await this.store.findOne({
      where: {
        slug
      },
      include: [{ model: User, as: 'owner' }]
    })

    return com
  }

  async uploadCommunity (community) {
    // get the parent Id of the community
    const parent = await this.store.findOne({
      where: {
        txId: community.originalTxId
      }
    })

    const defaults = {
      name: community.name,
      isOpen: community.isOpen
    }

    const communityModel = await initCommunity(community.txId, parent.id, defaults)

    const response = {
      ...communityModel.get()
    }

    return response
  }
}

export default CommunityApi
