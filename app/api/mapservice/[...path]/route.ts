import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
const tokenServiceUrl = process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET';
const username = process.env.NEXT_PUBLIC_PORTAL_USERNAME ?? '';
const password = process.env.NEXT_PUBLIC_PORTAL_PASSWORD ?? '';

// Cache for services to avoid fetching from portal on every request
let servicesCache: { [key: string]: string } = {};
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
      referer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
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

// Fetch allowed services from all gportal_* groups (unified with discover)
async function fetchAllowedServices(token: string): Promise<{ [key: string]: string }> {
  try {
    // Get all groups that start with gportal_
    const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=gportal_&token=${token}&num=100`;
    const groupsResponse = await fetch(groupsUrl);
    if (!groupsResponse.ok) {
      throw new Error(`Failed to fetch groups: ${groupsResponse.status}`);
    }
    const groupsData = await groupsResponse.json();
    if (groupsData.error) {
      throw new Error(`Portal API error: ${groupsData.error.message}`);
    }
    const serviceMap: { [key: string]: string } = {};
    if (groupsData.results && Array.isArray(groupsData.results)) {
      for (const group of groupsData.results) {
        try {
          const itemsUrl = `${portalUrl}/sharing/rest/content/groups/${group.id}?f=json&token=${token}`;
          const itemsResponse = await fetch(itemsUrl);
          if (itemsResponse.ok) {
            const itemsData = await itemsResponse.json();
            if (itemsData.items && Array.isArray(itemsData.items)) {
              itemsData.items.forEach((item: any) => {
                if (item.type === 'Map Service' && item.url) {
                  const urlParts = item.url.split('/');
                  const serviceIndex = urlParts.findIndex((part: string) => part === 'services');
                  if (serviceIndex !== -1 && serviceIndex + 1 < urlParts.length) {
                    const serviceName = urlParts[serviceIndex + 1];
                    if (!serviceMap[serviceName]) {
                      serviceMap[serviceName] = item.url;
                    }
                  }
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching items for group ${group.title}:`, error);
        }
      }
    }
    return serviceMap;
  } catch (error) {
    console.error('Error fetching allowed services:', error);
    return {};
  }
}

// Get cached services or fetch fresh ones
async function getServices(): Promise<{ [key: string]: string }> {
  const now = Date.now();
  
  // Return cached services if still valid
  if (now < cacheExpiry && Object.keys(servicesCache).length > 0) {
    return servicesCache;
  }

  // Fetch fresh services
  const token = await getToken();
  if (!token) {
    return {};
  }

  servicesCache = await fetchAllowedServices(token);
  cacheExpiry = now + CACHE_DURATION;
  
  return servicesCache;
}

// Handle all HTTP methods
async function handleRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const params = await context.params;
    const pathSegments = params.path;
    
    if (!pathSegments || pathSegments.length === 0) {
      // Redirect to discover page if no service name is provided
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/api/mapservice/discover`, 302);
    }

    // Get allowed services
    const services = await getServices();
    
    if (Object.keys(services).length === 0) {
      return NextResponse.json(
        { error: 'No services available or authentication failed' },
        { status: 503 }
      );
    }

    // Extract service name (first path segment)
    const [serviceName, ...subPath] = pathSegments;
    const targetUrl = services[serviceName];

    if (!targetUrl) {
      return NextResponse.json(
        { 
          error: 'Service not found or not allowed',
          availableServices: Object.keys(services)
        },
        { status: 404 }
      );    }

    // Build the final URL
    let finalUrl = targetUrl;
    if (subPath.length > 0) {
      // Skip 'MapServer' if it's the first element in subPath since targetUrl already ends with it
      const actualSubPath = subPath[0] === 'MapServer' ? subPath.slice(1) : subPath;
      if (actualSubPath.length > 0) {
        finalUrl = `${targetUrl}/${actualSubPath.join('/')}`;
      }
    }

    // Add query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get a fresh token for the service request
    const token = await getToken();
    if (token) {
      searchParams.set('token', token);
    }
    
    if (searchParams.toString()) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}${searchParams.toString()}`;
    }

    // Make the proxied request
    const proxyResponse = await fetch(finalUrl, {
      method: request.method,
      headers: {
        'User-Agent': request.headers.get('User-Agent') || 'MapService-Proxy',
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Encoding': request.headers.get('Accept-Encoding') || 'gzip, deflate',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.arrayBuffer() 
        : undefined,
    });

    if (!proxyResponse.ok) {
      return NextResponse.json(
        { error: `Service responded with status: ${proxyResponse.status}` },
        { status: proxyResponse.status }
      );
    }

    // Get response content
    const contentType = proxyResponse.headers.get('content-type') || 'application/json';
    const responseBody = await proxyResponse.arrayBuffer();

    // Create response with proper headers
    const response = new NextResponse(responseBody, {
      status: proxyResponse.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

    return response;

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error', details: String(error) },
      { status: 500 }
    );
  }
}

// Export handlers for all HTTP methods
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const OPTIONS = handleRequest;

const groupName = process.env.NEXT_PUBLIC_PORTAL_GROUP_NAME || 'gportal_api_services';
