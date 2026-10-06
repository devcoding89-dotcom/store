import { createHmac, createHash, timingSafeEqual } from 'node:crypto'

const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || ''
}

function signatureFor(expiry, password) {
  return createHmac('sha256', password)
    .update(`townsquare-admin:${expiry}`)
    .digest('base64url')
}

export function isValidAdminPassword(candidate) {
  const configuredPassword = getAdminPassword()
  if (!configuredPassword || !candidate) return false

  const expected = createHash('sha256').update(configuredPassword).digest()
  const actual = createHash('sha256').update(candidate).digest()
  return timingSafeEqual(expected, actual)
}

export function createAdminSessionToken() {
  const password = getAdminPassword()
  if (!password) throw new Error('ADMIN_PASSWORD is not configured.')

  const expiry = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS
  return `${expiry}.${signatureFor(expiry, password)}`
}

export function isValidAdminSessionToken(token) {
  const password = getAdminPassword()
  if (!password || typeof token !== 'string') return false

  const [expiryText, suppliedSignature, ...extraParts] = token.split('.')
  if (!expiryText || !suppliedSignature || extraParts.length > 0) return false

  const expiry = Number(expiryText)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(expiry) || expiry <= now || expiry > now + ADMIN_SESSION_TTL_SECONDS) return false

  const expected = Buffer.from(signatureFor(expiryText, password))
  const supplied = Buffer.from(suppliedSignature)
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}

export function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !isValidAdminSessionToken(token)) {
    return res.status(401).json({ error: 'Admin sign-in required.' })
  }
  next()
}
