import { gql } from 'apollo-server-express'

const typeDefs = gql`
  type Query {
    allCommunities: [Community]
    community(slug: String): Community
    posts(communitySlug: String): [PostPreview]
    user(ethAddr: String): User
    roles(ethAddr: String): [Role]
    userRoles: [Role]
    isNameAvailable(name: String!): Boolean
    userBalance(ethAddr: String, tokenAddress: String): Int
    getPost(txId: String): PostResponse
    postPreview(txId: String!): PostPreview
  }

  type Mutation {
    uploadImage(image: Image!, address: String!): ImageResponse
    uploadPost(postUpload: PostUpload!, communityTxId: String!): Post
    uploadComment(commentText: String!, postTxId: String!, communityTxId: String!, timestamp: Int!): Comment
    updateReadRequirement(txId: String!, readRequirement: Int!): Boolean
    setUsername(did: String!, name: String!): User
    deletePost(txId: String!): Boolean
    getSignInToken(addr: String!): String!
    authAccount(signature: String!, addr: String!): String
    verifyToken(token: String!): Boolean
  }

  type ImageResponse {
    txId: String
  }

  input Image {
    data: String
    mimeType: String
  }

  input PostUpload {
    title: String
    subtitle: String
    postText: String
    canonicalLink: String
    originalTxId: String
    timestamp: Int
    featuredImg: String
    readRequirement: Int
  }

  input CommentUpload {
    userDid: String
    postText: String
    postTxId: String
    txId: String
    timestamp: Int
  }

  type Comment {
    id: ID,
    txId: String
    postText: String
    timestamp: Int
    isDeleted: Boolean
    user: User
    community: Community
  }

  type PostPreview {
    id: ID
    txId: String
    user: User
    community: Community
    title: String
    subtitle: String
    timestamp: Int
    featuredImg: String
    canonicalLink: String
    readRequirement: Int
  }

  type PostResponse {
    post: Post!
    comments: [Comment]!
    userBalance: Int
    readRequirement: Int
    tokenSymbol: String
    tokenAddress: String
  }

  type Post {
    id: ID
    txId: String
    user: User
    community: Community
    comments: [Comment]
    title: String
    subtitle: String
    postText: String
    timestamp: Int
    canonicalLink: String
    featuredImg: String
    readRequirement: Int
  }

  type Community {
    id: ID
    txId: String
    name: String
    state: String
    description: String
    imageTxId: String
    tokenAddress: String
    tokenSymbol: String
    defaultReadRequirement: Int
    owner: User
    slug: String
    showOwner: Boolean
  }

  type PostData {
    post: Post
    comments: [Comment]
  }

  type User {
    id: ID
    address: String
    name: String
    image: String
    role: Role
  }

  type Role {
    id: ID
    user: User
    community: Community
    title: String
  }
`

export default typeDefs
