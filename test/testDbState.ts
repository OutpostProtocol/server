import { ROLES } from 'outpost-protocol'
import { Pool } from 'pg'
import deepEqual from 'deep-equal'
const pool = new Pool()

const communityColumns = '"id", "txId", "state", "name", "isOpen", "blockHash"'

pool.query(`SELECT ${communityColumns} from communities`, (err, res) => {
  if (err) console.log(err, 'THE ERROR')

  testCommunities(res.rows)
    .then(isClean => {
      if (isClean) console.log('✨ Test completed successfully.')
      pool.end()
    })
    .catch(err => {
      console.log('The error caught during the test:', err)
      pool.end()
    })
})

async function testCommunities (communities) {
  let isClean = true

  for (let i = 0; i < communities.length; i++) {
    const com = communities[i]

    console.log(`Testing community ${com.txId}...`)

    if (!com.blockHash) {
      console.log(`Community ${com.txId} not yet confirmed. Skipping...`)
    }

    const remoteState = JSON.parse(com.state)
    removeFalseItems(remoteState)

    const stateFromDb = await getComStateFromDb(com.id, com.name, com.isOpen)

    delete remoteState.timestamps

    const isEqual = deepEqual(stateFromDb, remoteState)
    if (!isEqual) {
      isClean = false
      console.log(`Error: state from db is incorrect for community ${com.txId} in test ${i}!`)
      console.log('The remote state:', remoteState)
      console.log('The computed state from the db:', stateFromDb)
    }
  }

  return isClean
}

async function getComStateFromDb (id, name, isOpen) {
  const state = {
    name,
    isOpen,
    guidelines: null,
    owner: null,
    admins: {},
    moderators: {},
    members: {},
    children: {}
  }

  // get all the roles
  const roles = (await pool.query(`SELECT "userId", "role" from roles WHERE "communityId" = ${id}`)).rows
  for (let i = 0; i < roles.length; i++) {
    const { userId, role } = roles[i]

    const users = (await pool.query(`SELECT "did" from users WHERE "id" = ${userId} LIMIT 1`)).rows
    const userDid = users[0].did
    switch (role) {
      case ROLES.OWNER:
        addOwner(state, userDid)
        break
      case ROLES.ADMIN:
        addAdmin(state, userDid)
        break
      case ROLES.MODERATOR:
        addMod(state, userDid)
        break
      case ROLES.MEMBER:
        addMember(state, userDid)
        break
      default:
        console.log('THIS SHOULD NEVER HAPPEN!!!!!!!!')
    }
  }

  // get child communities
  const children = (await pool.query(`SELECT "txId" from communities WHERE "parentId" = ${id}`)).rows
  for (let i = 0; i < children.length; i++) {
    const childTxId = children[i].txId

    state.children[childTxId] = true
  }

  return state
}

function addOwner (state, did) {
  state.owner = did
}

function addAdmin (state, did) {
  state.admins[did] = true
}

function addMod (state, did) {
  state.moderators[did] = true
}

function addMember (state, did) {
  state.members[did] = true
}

function removeFalseItems (state) {
  Object.keys(state.admins).forEach(did => {
    if (!state.admins[did]) delete state.admins[did] // eslint-disable-line
  })

  Object.keys(state.moderators).forEach(did => {
    if (!state.moderators[did]) delete state.moderators[did] // eslint-disable-line
  })

  Object.keys(state.members).forEach(did => {
    if (!state.members[did]) delete state.members[did] // eslint-disable-line
  })

  Object.keys(state.children).forEach(txId => {
    if (!state.children[txId]) delete state.children[txId] // eslint-disable-line
  })
}
