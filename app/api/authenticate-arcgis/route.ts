
import { NextResponse } from 'next/server';
import * as jose from 'jose';
import https from 'https';
// Helper to verify JWT from Authorization header
async function verifyRequestJWT(request: Request): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[groups API] Missing or invalid Authorization header');
      return false;
    }
    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.TOKEN_SECRET;
    if (!secret) {
      console.error('[groups API] TOKEN_SECRET not set');
      return false;
    }
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    await jose.jwtVerify(token, secretKey);
    return true;
  } catch (err) {
    console.error('[groups API] JWT verification failed:', err);
    return false;
  }
}

// Read envs at runtime to avoid Next.js build-time inlining and support both
// server-only and NEXT_PUBLIC_ env var names.
function getRuntimeEnv() {
  return {
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL || 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.PORTAL_TOKEN_SERVICE_URL || 'PORTAL_TOKEN_NOT_SET',
    username: process.env.SDF_USERNAME || '',
    password: process.env.SDF_PASSWORD || '',
  };
}

async function getToken(): Promise<string | null> {
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  try {
    const { username, password, tokenServiceUrl } = getRuntimeEnv();

    if (!username || !password) {
      console.error('Missing ArcGIS credentials in environment variables');
      return null;
    }
    
    if (tokenServiceUrl === 'PORTAL_TOKEN_NOT_SET') {
      console.error('Token service URL not configured');
      return null;
    }
    
    const params = new URLSearchParams({
      username,
      password,
      client: 'referer',
      referer: process.env.APP_URL_SDF_GEOAPP || process.env.APP_URL || 'http://localhost:3000',
      f: 'json',
    });
    
    const response = await fetch(tokenServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error getting token:', data.error);
      return null;
    }
    
    return data.token;
  } catch (error) {
    console.error('Token fetch error:', error);
    return null;
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
  }
}

async function fetchPortalGroups(token: string): Promise<string[]> {
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  try {
    const { portalUrl } = getRuntimeEnv();
    const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=gportal_&token=${token}&num=100`;
    const response = await fetch(groupsUrl, {
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Portal API error: ${data.error.message}`);
    }
    
    if (data.results && Array.isArray(data.results)) {
      return data.results
      .filter((group: any) => group.title && group.title.startsWith('gportal_'))
      .map((group: any) => group.title);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching portal groups:', error);
    return [];
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
  }
}


export async function POST(request: Request) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to authenticate with ArcGIS Portal' },
        { status: 500 }
      );
    }
    
    // Test the token
    const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    try {
      const { portalUrl } = getRuntimeEnv();
      const testUrl = `${portalUrl}/sharing/rest/portals/self?f=json&token=${token}`;
      const refererUrl = process.env.NEXT_PUBLIC_APP_URL_SDF_GEOAPP || 'http://localhost:3000';
      
      const testResponse = await fetch(testUrl, {
        headers: {
          'Referer': refererUrl
        }
      });
      const testData = await testResponse.json();
      if (testData.error) {
        console.error('Token test failed:', testData.error);
        return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
      }
    } finally {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }

    // Return the token
    return NextResponse.json({
      token: token,
      expires: Date.now() + (60 * 60 * 1000) // 1 hour
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}