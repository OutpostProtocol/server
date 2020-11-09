import Arweave from 'arweave/node'

// the maximum number of transactions we can get from graphql at once
const MAX_REQUEST = 100

interface TagFilter {
  name: string
  values: string[]
}

interface BlockFilter {
  max: number
  min: number
}

interface ReqVariables {
  tags: TagFilter[]
  block: BlockFilter
  first: number
  after?: string
  owners: string[]
}

export async function fetchNewTxIds (arweave: Arweave, appName: string, communityTxId: string, endHeight: number, startHeight = 0) {
  const tags: TagFilter[] = [{
    name: 'App-Name',
    values: [appName]
  },
  {
    name: 'Community',
    values: [communityTxId]
  }]

  let variables: ReqVariables = {
    tags,
    block: {
      max: endHeight,
      min: startHeight
    },
    first: MAX_REQUEST,
    owners: [process.env.OUTPOST_AR_ADDRESS]
  }

  let transactions = await getNextPage(arweave, variables)

  const txInfos = transactions.edges

  while (transactions.pageInfo.hasNextPage) {
    const cursor = transactions.edges[MAX_REQUEST - 1].cursor

    variables = {
      ...variables,
      after: cursor
    }

    transactions = await getNextPage(arweave, variables)

    txInfos.push(...transactions.edges)
  }

  return txInfos
}

async function getNextPage (arweave: Arweave, variables: ReqVariables) {
  const query = `
    query getNewTxIds($tags: [TagFilter!]!, $block: BlockFilter!, $first: Int!, $after: String, $owners: [String!]!) {
      transactions(tags: $tags, block: $block, first: $first, sort: HEIGHT_ASC, after: $after, owners: $owners) {
        pageInfo {
          hasNextPage
        }
        edges {
          cursor
          node {
            id
          }
        }
      }
    }
  `

  const response = await arweave.api.post('graphql', {
    query,
    variables
  })

  if (response.status !== 200) {
    throw new Error(`Unable to retrieve post transactions. Arweave gateway responded with code ${response.status}`)
  }

  return response.data.data.transactions
}
