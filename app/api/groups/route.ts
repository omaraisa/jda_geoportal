
import { NextResponse } from 'next/server';

// JWT verification dependencies
import * as jose from 'jose';
// Helper to verify JWT from Authorization header
async function verifyRequestJWT(request: Request): Promise<{ userId?: string; groups?: string[] } | null> {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[groups API] Missing or invalid Authorization header');
      return null;
    }
    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.TOKEN_SECRET; // Server-only secret
    if (!secret) {
      console.error('[groups API] TOKEN_SECRET not set');
      return null;
    }
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Extract user info from JWT
    return {
      userId: payload.sub as string,
      groups: payload.groups as string[] || []
    };
  } catch (err) {
    console.error('[groups API] JWT verification failed:', err);
    return null;
  }
}

const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://gis.jda.gov.sa/portal';
const tokenServiceUrl = process.env.PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_SERVICE_URL_NOT_SET';
const username = process.env.SDF_USERNAME ?? '';
const password = process.env.SDF_PASSWORD ?? '';

async function fetchUserGroupsFromAuthServer(userId: string): Promise<string[]> {
  try {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    if (!authUrl) {
      console.error('Auth URL not configured');
      return [];
    }

    // TODO: Implement the actual auth server API endpoint
    // This should be a secure server-to-server call
    // For now, returning mock data - replace with actual implementation
    console.log(`Fetching groups for user: ${userId} from auth server`);
    
    // Mock implementation - replace with actual API call
    // const response = await fetch(`${authUrl}/api/user/${userId}/groups`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.INTERNAL_AUTH_TOKEN}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    
    // Mock response - replace with actual data from auth server
    return ['gportal_admin', 'gportal_user']; // Example allowed groups
  } catch (error) {
    console.error('Error fetching user groups from auth server:', error);
    return [];
  }
}

async function getToken(): Promise<string | null> {
  try {
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
      referer: process.env.NEXT_PUBLIC_APP_URL_SDF_GEOAPP,
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
  }
}

async function fetchPortalGroups(token: string): Promise<string[]> {
  try {
    const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=gportal_&token=${token}&num=100`;
    const response = await fetch(groupsUrl);
    
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
  }
}


export async function POST(request: Request) {
  // Verify JWT and extract user info
  const userInfo = await verifyRequestJWT(request);
  if (!userInfo) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing token' },
      { status: 401 }
    );
  }

  try {
    // Get user's allowed groups from auth server
    const allowedGroups = await fetchUserGroupsFromAuthServer(userInfo.userId!);
    
    // Get ArcGIS token for portal access
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to authenticate with ArcGIS Portal' },
        { status: 500 }
      );
    }

    // Fetch all portal groups
    const allPortalGroups = await fetchPortalGroups(token);
    
    // Filter groups based on user's permissions
    const userAllowedGroups = allPortalGroups.filter(groupName => {
      // Check if user has permission for this group
      // This could be based on group naming convention or explicit permissions
      return allowedGroups.some(allowedGroup => 
        groupName.includes(allowedGroup) || allowedGroup === '*' // Wildcard for admin
      );
    });

    return NextResponse.json({
      groups: userAllowedGroups,
      userId: userInfo.userId
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}