require('dotenv-flow')
  .config()

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { SECRET_PASSWORD, WALLET_PATH } = process.env

const cipher = crypto.createCipheriv(
  'aes-192-cbc',
  crypto.scryptSync(SECRET_PASSWORD, 'salt', 24),
  Buffer.alloc(16)
);

const input = fs.createReadStream(path.resolve(WALLET_PATH))
const output = fs.createWriteStream(path.resolve('./wallet.sec'))

input.pipe(cipher).pipe(output)
