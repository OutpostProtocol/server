import express from 'express'

import uploadImage from './uploadImage'
import getChallenge, { checkChallengeSchema } from './getChallenge'
import verifyChallenge, { checkVerifyChallengeSchema } from './verifyChallenge'
import validateToken, { checkValidateTokenSchema } from './validateToken'

export default () => express()
  .post('/image-upload', uploadImage)
  .post('/get-challenge', checkChallengeSchema(), getChallenge)
  .post('/verify-challenge', checkVerifyChallengeSchema(), verifyChallenge)
  .post('/validate-token', checkValidateTokenSchema(), validateToken)
