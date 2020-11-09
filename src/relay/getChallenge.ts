import { Request, Response } from 'express'
import { checkSchema } from 'express-validator'

import { getChallengeToken } from '../store/user'

export const checkChallengeSchema = () => checkSchema({
  address: {
    in: ['body'],
    errorMessage: 'You must provide an ethereum address in the body of the request',
    isString: true,
    customSanitizer: { options: (value) => value.toLowerCase() }
  }
})

async function getChallenge (req: Request, res: Response) {
  const address = req.body.address

  const challenge = await getChallengeToken(address)
  res.send(challenge)
}

export default getChallenge
