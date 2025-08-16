import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient() {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(url)
  }
  return redis
}

export async function testRedisConnection() {
  const client = getRedisClient()
  try {
    await client.set('test_key', 'test_value', 'EX', 10)
    const value = await client.get('test_key')
    return value === 'test_value'
  } catch (err) {
    console.error('Redis test error:', err)
    return false
  }
} 