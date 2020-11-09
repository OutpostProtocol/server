const Arweave = require('arweave/node')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// init Arweave js
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
})

const password = process.env.SECRET_PASSWORD

const algorithm = 'aes-192-cbc'
const key = crypto.scryptSync(password, 'salt', 24)
const iv = Buffer.alloc(16)

const decipher = crypto.createDecipheriv(algorithm, key, iv)

const walletPath = path.resolve(__dirname, '../wallet.sec')
const encrypted = fs.readFileSync(walletPath)

let rawWallet = decipher.update(encrypted, 'hex', 'utf8')
rawWallet += decipher.final('utf8')

const wallet = JSON.parse(rawWallet)

module.exports = {
  arweave,
  wallet
}
