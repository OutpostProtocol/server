export const getComId = (comId) => {
  if (process.env.NODE_ENV === 'development') {
    return `${comId}:development`
  } else if (process.env.NODE_ENV === 'staging') {
    return `${comId}:staging`
  }
  return comId
}
