import { addPublication } from './helpers/insertions'
import { dbHandler } from '../src/store'
import publications from './publications'

const addAll = async () => {
  await dbHandler.startDB(false)

  const pubArr = Object.values(publications)

  for (let i = 0; i < pubArr.length; i++) {
    const [user, community] = pubArr[i]

    try {
      await addPublication(user, community)
    } catch {
      console.log(`Unable to insert ${community.slug}`)
    }
  }
}

addAll()
  .then(() => console.log('success!'))
  .catch(e => console.error(e, 'ERROR CAUGHT TRYING TO ADD PUBLICATIONS'))
