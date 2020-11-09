import { Response } from 'express'
import { AuthenticationError } from 'apollo-server-express'
import { checkSchema } from 'express-validator'

import { uploadImageFromBase64 } from '../arweave-uploaders/imageUpload'
import setContext from '../context'

export const checkImageUpload = () => checkSchema({
  rawData: {
    in: ['body'],
    errorMessage: 'You must provide a "rawData" property with the data of the image',
    isString: true
  },
  mimeType: {
    in: ['body'],
    errorMessage: 'You must provide a "mimeType" property in the body of the request',
    isString: true
  }
})

async function uploadImage (req, res: Response) {
  const { isValid, user } = await setContext({ req })
  if (!isValid) throw new AuthenticationError('User not authenticated')

  const { status, txId, gateway } = await uploadImageFromBase64(
    {
      data: req.body.rawData,
      mimeType: req.body.mimeType
    },
    user.address
  )

  res.status(status).send({
    txId,
    gateway
  })
}

export default uploadImage
