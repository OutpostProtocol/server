import { addWriter } from './helpers/insertions'
import { dbHandler } from '../src/store'
import yargs = require('yargs')

const argv = yargs.options({
  comId: { type: 'string', demandOption: true },
  address: { type: 'string', demandOption: true },
  name: { type: 'string', demandOption: true },
  image: { type: 'string', demandOption: true }
}).argv

const { address, name, image } = argv
let { comId } = argv

if (process.env.NODE_ENV === 'development') {
  comId = `${comId}:development`
} else if (process.env.NODE_ENV === 'staging') {
  comId = `${comId}:staging`
}

const addRole = async () => {
  await dbHandler.startDB()
  await addWriter(address, image, name, comId)
}

addRole()
  .then(() => console.log('success'))
  .catch(e => console.error(e.message))
