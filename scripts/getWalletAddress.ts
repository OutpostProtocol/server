import fs from 'fs'
import path from 'path'
import Arweave from 'arweave'

// @ts-expect-error
const { ...jwk } = JSON.parse(fs.readFileSync(path.resolve('./wallet.json'), 'utf-8'))

// @ts-expect-error
Arweave.init().wallets.jwkToAddress(jwk)
  .then(console.log)
  .catch(console.error)
