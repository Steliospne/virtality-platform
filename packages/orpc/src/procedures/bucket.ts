import { CDN_URL } from '@virtality/shared/types'
import { authed } from '../middleware/auth.ts'

const listImages = authed
  .route({ path: '/bucket/list', method: 'GET' })
  .handler(async ({ context }) => {
    const { s3 } = context
    const files = await s3.listFiles()
    const exclude = ['mp4', 'mov']
    const baseURL = CDN_URL

    const filterHandler = (i?: string) => {
      if (!i) return
      const type = i.split('.')[1]
      if (!type) return
      if (!exclude.includes(type)) return i
    }

    return files
      .filter((i): i is string => !!filterHandler(i))
      .map((item) => ({
        imageURL: `${baseURL}/${item}`,
        key: item,
      }))
  })

export const bucket = {
  list: listImages,
}
