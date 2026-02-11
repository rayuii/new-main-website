import 'dotenv/config';

export async function GET({ url }: any) {
  const location = url.searchParams.get('location');
  if (!location) {
    return new Response(JSON.stringify({ error: 'Missing location parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.IPGEOLOCATION_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(
      `https://api.ipgeolocation.io/v2/timezone?apiKey=${apiKey}&location=${encodeURIComponent(location)}`
    );
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch timezone info' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
