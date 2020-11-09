import { User, Community } from './helpers/insertions'

const publications: Record<string, [User, Community]> = {
  unit_tests: [{
    address: '0x3cb0660b9419b06521aed844ad6d5a7b355bd055',
    name: 'Outpost Testers',
    image: 'https://arweave.net/RBg1ysAnKmlnU8YROY2g2KVbE3d6rgobVV4qzss2Isk'
  }, {
    txId: 'unit_tests',
    imageTxId: 'RBg1ysAnKmlnU8YROY2g2KVbE3d6rgobVV4qzss2Isk',
    readRequirement: 0,
    description: 'A community dedicated to the wonders of unit testing.',
    name: 'The Outpost Testers Guild',
    slug: 'unit_tests',
    showOwner: true
  }]
}

export default publications
