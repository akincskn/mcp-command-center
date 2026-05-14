const TAVILY_BASE = 'https://api.tavily.com';

export async function tavilyApiCall(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const res = await fetch(`${TAVILY_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, ...body }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tavily API error ${res.status}: ${errText}`);
  }

  return res.json() as Promise<unknown>;
}
