import { Model } from 'sequelize'
import { dbHandler } from '../src/store'
import { Community, Post } from '../src/store/models'

const handleSetAll = async () => {
  await dbHandler.startDB()

  const communities = await Community.findAll()

  for (let i = 0; i < communities.length; i++) {
    const cur = communities[i]

    const requirement: number = cur.get('defaultReadRequirement') as number

    const posts: [Model] = await Post.findAll({ where: { communityId: cur.get('id') as number } })

    await setRequirements(posts, requirement)
  }
}

const setRequirements = async (posts: [Model], requirement: number): Promise<void> => {
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]

    await p.update({
      readRequirement: requirement
    })
  }
}

handleSetAll()
  .then(() => console.log('success!'))
  .catch((e) => console.log(e, 'damnit'))
