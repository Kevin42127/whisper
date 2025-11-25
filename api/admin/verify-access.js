export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accessKey } = req.body

  if (!accessKey) {
    return res.status(400).json({ error: 'Access key is required' })
  }

  const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY

  if (!ADMIN_ACCESS_KEY) {
    console.error('ADMIN_ACCESS_KEY 環境變數未設置')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (accessKey === ADMIN_ACCESS_KEY) {
    return res.status(200).json({ valid: true })
  } else {
    return res.status(200).json({ valid: false })
  }
}

