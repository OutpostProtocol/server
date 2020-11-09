import { Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { verifyUserToken } from '../store/user'

export const checkValidateTokenSchema = () => checkSchema({
  token: {
    in: ['body'],
    errorMessage: 'You must provide a token in the body of the request',
    isString: true
  }
})

async function validateToken (req: Request, res: Response) {
  const { token } = req.body

  const { isValid } = await verifyUserToken(token)

  res.send(isValid)
}

export default validateToken
