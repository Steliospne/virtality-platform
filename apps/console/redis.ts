'use server'
import Redis from 'ioredis'

if (!process.env.REDIS_SECRET) throw new Error('REDIS_SECRET is not defined')

const globalForRedis = global as unknown as {
  redis: Redis
}

const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_SECRET, { lazyConnect: true })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

export const getKey = async (key: string) => {
  return await redis.get(key)
}

export const setKey = async (key: string, val: string, ttl = 5 * 60) => {
  await redis.set(key, val, 'EX', ttl)
}

export const deleteKey = async (key: string | Buffer) => {
  return await redis.del(key)
}

export const keyExists = async (key: string | Buffer) => {
  const exists = await redis.exists(key)
  if (exists) throw new Error(`Key already exists.`)
  return exists
}
