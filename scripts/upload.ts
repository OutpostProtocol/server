import PostApi from '../src/dataSources/postApi'
import { dbHandler } from '../src/store'
import { Post } from '../src/store/models'
import { getComId } from './helpers'

const UNIT_TESTS_AUTHOR = '0x3cb0660b9419b06521aed844ad6d5a7b355bd055'
const UNIT_TESTS_CONTENT = 'This is a page to satisfy unit tests. <img src="https://www.arweave.org/nav-logo.svg" alt="Outpost"></img>'

const upload = async () => {
  await dbHandler.startDB()
  const postApi = new PostApi({ Post })

  const time = Math.floor(Date.now() / 1000)

  await postApi.uploadPost({
    title: 'On the subject of unit testing.',
    subtitle: 'What does it all mean?!',
    postText: UNIT_TESTS_CONTENT,
    timestamp: time,
    featuredImg: getFeaturedImage(UNIT_TESTS_CONTENT)
  }, UNIT_TESTS_AUTHOR, getComId('unit_tests'))
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
