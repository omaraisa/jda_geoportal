import https from 'https';
import { NextRequest } from 'next/server';
import fetch from 'node-fetch';

export const runtime = 'nodejs';

const serviceMap: Record<string, string> = {
  SPGA_built_con: 'https://gis.jda.gov.sa/agserver/rest/services/SPGA_built_con/MapServer/0',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { service: string } }
) {
  const { service } = await params;
  const targetUrl = serviceMap[service];

  if (!targetUrl) {
    return new Response('Service not found', { status: 404 });
  }

  // Pass through the query string (important for ArcGIS JS to send `f=json`)
  const query = req.nextUrl.searchParams.toString();
  const finalUrl = `${targetUrl}?${query}`;

  try {
    const response = await fetch(finalUrl, {
      method: 'GET',
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    // Pass through original response headers
    const headers = new Headers();
    response.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    const body = await response.arrayBuffer(); // Don't parse to JSON/text

    return new Response(body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(JSON.stringify({ error: 'Proxy failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
