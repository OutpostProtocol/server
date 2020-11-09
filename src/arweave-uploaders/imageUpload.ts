import { decode } from 'base64-arraybuffer'
import { wallet, arweave } from '../arweave'
import dispatchTx from './dispatchTx'

export const IMAGE_MIME_TYPE_REGEX = /image\/*/

export interface ImageUploadResponse {
  txId: string
  status: number
  gateway: string
}

export interface Base64ImageFile {
  data: string
  mimeType: string
}

export async function uploadImageFromBase64 (
  image: Base64ImageFile, address: string
): Promise<ImageUploadResponse> {
  if (!image) {
    return null
  }

  const { data: dataString, mimeType } = image
  const data: ArrayBuffer = decode(dataString)

  return await createAndUploadImageTx(data, mimeType, address)
}

export async function createAndUploadImageTx (
  data: ArrayBuffer, mimeType: string, address?: string
): Promise<ImageUploadResponse> {
  if (!IMAGE_MIME_TYPE_REGEX.test(mimeType)) {
    throw new Error(`Invalid file mimetype '${mimeType}'. This endpoint only accepts image files.`)
  }

  const imgTx = await arweave.createTransaction({ data }, wallet)

  imgTx.addTag('Content-Type', mimeType)
  if (address) imgTx.addTag('Address', address)

  const { response: postRes, gateway } = await dispatchTx(imgTx)
  const txId = imgTx.id

  return {
    status: postRes.status,
    txId,
    gateway
  }
}
