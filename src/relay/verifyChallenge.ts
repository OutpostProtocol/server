import { Request, Response } from 'express'
import { checkSchema } from 'express-validator'

import { verifyChallengeAndIssueToken } from '../store/user'

export const checkVerifyChallengeSchema = () => checkSchema({
  signature: {
    in: ['body'],
    errorMessage: 'You must provide a signature in the body of the request',
    isString: true
  },
  address: {
    in: ['body'],
    errorMessage: 'You must provide an ethereum address in the body of the request',
    isString: true,
    customSanitizer: { options: (value) => value.toLowerCase() }
  }
})

async function verifyChallenge (req: Request, res: Response) {
  const { signature, address } = req.body

  const token = await verifyChallengeAndIssueToken(signature, address)

  res.send(token)
}

export default verifyChallenge
