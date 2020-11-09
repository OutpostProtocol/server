import { verifyUserToken } from './store/user'

const setContext = async ({ req }) => {
  const token = req.headers.authorization

  if (!token) {
    return
  }

  const { user, isValid } = await verifyUserToken(token)

  return { user, isValid }
}

export default setContext
