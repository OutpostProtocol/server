// Script works with exports from substack

import PostApi from '../src/dataSources/postApi'
import { dbHandler } from '../src/store'
import { Post, Community } from '../src/store/models'
import neatCsv from 'neat-csv'
import { batch } from 'promises-tho'
import path from 'path'
import fs from 'fs'
import yargs = require('yargs')

const argv = yargs.options({
  comId: { type: 'string', demandOption: true },
  exportPath: { type: 'string', demandOption: true },
  author: { type: 'string', demandOption: true },
  readRequirement: { type: 'number', demandOption: true }
}).argv

const { exportPath, author, readRequirement } = argv
let { comId } = argv

if (process.env.NODE_ENV === 'development') {
  comId = `${comId}:development`
} else if (process.env.NODE_ENV === 'staging') {
  comId = `${comId}:staging`
}

const postCSV = path.resolve(__dirname, `../${exportPath}/posts.csv`)
const csvString = fs.readFileSync(postCSV, 'utf8')

const api = new PostApi({ Post })

migrate()
  .then(() => console.log('success!'))
  .catch(e => console.error(e, 'THE ERROR THROWN'))

async function migrate () {
  await dbHandler.startDB()

  // check the community exists
  const com = await Community.findOne({ where: { txId: comId } })
  if (!com) throw new Error(`No community exists with txId "${comId}"`)

  let posts = await neatCsv(csvString)

  posts = filterNFomat(posts)

  const uploadBatch = batch({ batchSize: 4, batchDelayMs: 150 }, uploadPost)

  await uploadBatch(posts)
}

async function uploadPost (post: any) {
  const contentPath = path.join(__dirname, `../${exportPath}/posts/${post.post_id}.html`)
  const content = fs.readFileSync(contentPath, 'utf8')

  const postedAt = Math.floor(Date.parse(post.post_date) / 1000)
  const featuredImg = getFeaturedImage(content)

  const uploadData = {
    title: post.title,
    subtitle: post.subtitle,
    postText: content,
    timestamp: postedAt,
    featuredImg,
    readRequirement
  }

  await api.uploadPost(uploadData, author, comId)
}

function getFeaturedImage (postText) {
  const imgRegex = /<img[^>]+src="http([^">]+)/

  if (!postText.match(imgRegex)) return

  const featuredImg = postText.match(imgRegex)[0].split(/src="/)[1]
  return featuredImg
}

function filterNFomat (posts) {
  posts = posts.filter(p => p.is_published && JSON.parse(p.is_published))

  posts = posts.filter(p => !p.title.includes('SNIPPET'))

  // filter out titles
  posts = posts.filter(p => {
    if (repeatPosts.includes(p.title)) {
      return false
    }

    return true
  })

  posts = posts.map(p => {
    p.title = formatTitle(p.title)
    return p
  })

  return posts
}

function formatTitle (title) {
  title = title.replace('[FULL POST]', '')
  title = title.replace('[Subscribers only]', '')

  return title.trim()
}
