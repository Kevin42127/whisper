import crypto from 'crypto'

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

  const { sessionToken } = req.body

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token is required' })
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD

  if (!ADMIN_EMAIL || !ADMIN_SECRET) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const payload = verifySignedToken(sessionToken, ADMIN_SECRET)

  if (payload && payload.email === ADMIN_EMAIL) {
    return res.status(200).json({ valid: true })
  } else {
    return res.status(200).json({ valid: false })
  }
}

