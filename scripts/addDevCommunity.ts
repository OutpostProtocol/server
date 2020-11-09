import PostApi from '../src/dataSources/postApi'
import { dbHandler } from '../src/store'
import { Post } from '../src/store/models'
import { User, Community, addPublication } from './helpers/insertions'
import { getComId } from './helpers'

const UNIT_TESTS_USER: User = {
  address: '0x3cb0660b9419b06521aed844ad6d5a7b355bd055',
  name: 'Outpost Testers',
  image: 'https://arweave.net/RBg1ysAnKmlnU8YROY2g2KVbE3d6rgobVV4qzss2Isk'
}

const UNIT_TESTS_COMMUNITY: Community = {
  txId: 'unit_tests',
  imageTxId: 'RBg1ysAnKmlnU8YROY2g2KVbE3d6rgobVV4qzss2Isk',
  defaultReadRequirement: 0,
  description: 'A community dedicated to the wonders of unit testing.',
  name: 'The Outpost Testers Guild',
  slug: 'unit_tests',
  showOwner: true
}

const UNIT_TESTS_CONTENT = 'This is a page to satisfy unit tests. <img src="https://www.arweave.org/nav-logo.svg" alt="Outpost"></img>'

const upload = async () => {
  await dbHandler.startDB()
  const postApi = new PostApi({ Post })

  await addPublication(UNIT_TESTS_USER, UNIT_TESTS_COMMUNITY)

  const time = Math.floor(Date.now() / 1000)

  await postApi.uploadPost({
    title: 'On the subject of unit testing.',
    subtitle: 'What does it all mean?!',
    postText: UNIT_TESTS_CONTENT,
    timestamp: time,
    featuredImg: getFeaturedImage(UNIT_TESTS_CONTENT)
  }, UNIT_TESTS_USER.address, getComId(UNIT_TESTS_COMMUNITY.txId))
}

function getFeaturedImage (postText) {
  const imgRegex = /<img[^>]+src="http([^">]+)/

  if (!postText.match(imgRegex)) return

  const featuredImg = postText.match(imgRegex)[0].split(/src="/)[1]
  return featuredImg
}

upload()
  .then(() => console.log('success'))
  .catch(e => console.error(e, 'whoops'))
