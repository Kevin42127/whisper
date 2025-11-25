import crypto from 'crypto'

function createSignedToken(email, secret) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000
  const payload = {
    email,
    expiresAt
  }
  const payloadStr = JSON.stringify(payload)
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex')
  
  const token = Buffer.from(payloadStr).toString('base64url') + '.' + signature
  return { token, expiresAt }
}

function verifySignedToken(token, secret) {
  try {
    const [payloadStr, signature] = token.split('.')
    if (!payloadStr || !signature) {
      return null
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex')

    if (signature !== expectedSignature) {
      return null
    }

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString())
    
    if (payload.expiresAt < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, accessKey } = req.body

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_ACCESS_KEY) {
    console.error('管理員環境變數未設置')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (!accessKey || accessKey !== ADMIN_ACCESS_KEY) {
    return res.status(403).json({ error: 'Invalid access key' })
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const { token, expiresAt } = createSignedToken(email, ADMIN_SECRET)

    return res.status(200).json({
      success: true,
      sessionToken: token,
      expiresAt
    })
  } else {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
}

