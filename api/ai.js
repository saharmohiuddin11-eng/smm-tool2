export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, maxTokens = 2000 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Error ${response.status}`;
      if (response.status === 429) return res.status(429).json({ error: 'Rate limit — wait a moment and try again.' });
      if (response.status === 401) return res.status(401).json({ error: 'Invalid API key in Vercel environment variables.' });
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('') || '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('AI route error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
