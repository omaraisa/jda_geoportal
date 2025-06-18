import { NextResponse } from 'next/server';

// Environment variables
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
const tokenServiceUrl = process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET';
const username = process.env.NEXT_PUBLIC_PORTAL_USERNAME ?? '';
const password = process.env.NEXT_PUBLIC_PORTAL_PASSWORD ?? '';

// Get token for ArcGIS API access
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
      referer: process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
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

// Fetch all portal groups
async function fetchPortalGroups(token: string): Promise<string[]> {
  try {
    // Fetch all groups with 'gportal_' prefix, with a limit of 100
    const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=gportal_&token=${token}&num=100`;
    
    const response = await fetch(groupsUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Portal API error: ${data.error.message}`);
    }
    
    // Extract group titles from results
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

export async function GET() {
  try {
    // Get authentication token
    const token = await getToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to authenticate with ArcGIS Portal' },
        { status: 500 }
      );
    }
    
    // Fetch all portal groups
    const groups = await fetchPortalGroups(token);
    
    // Return the array of group names
    return NextResponse.json(groups);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
