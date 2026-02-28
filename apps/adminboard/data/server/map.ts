'use server'
import { prisma } from '@virtality/db'

export const getMaps = async () => {
  try {
    const maps = await prisma.map.findMany()
    return maps
  } catch (error) {
    console.log('Error getting maps', error)
  }
}
