import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-in-production'

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function signOtpToken(email: string, otp: string): string {
  const expiry = Date.now() + 10 * 60 * 1000 // 10 minutes
  const payload = JSON.stringify({ email: email.toLowerCase(), otp, expiry })
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifyOtpToken(
  token: string,
  email: string,
  otp: string
): boolean {
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return false
    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
    if (sig !== expectedSig) return false
    const data = JSON.parse(payload) as { email: string; otp: string; expiry: number }
    if (Date.now() > data.expiry) return false
    if (data.email !== email.toLowerCase()) return false
    if (data.otp !== otp) return false
    return true
  } catch {
    return false
  }
}
