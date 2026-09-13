import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored || !stored.includes(':')) return false
  const [salt, original] = stored.split(':')
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(original, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}
