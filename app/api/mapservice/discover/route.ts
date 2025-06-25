import { NextResponse } from 'next/server';

// Environment variables
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
const tokenServiceUrl = process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET';
const username = process.env.NEXT_PUBLIC_PORTAL_USERNAME ?? '';
const password = process.env.NEXT_PUBLIC_PORTAL_PASSWORD ?? '';

// Group name from environment variable
const groupName = process.env.NEXT_PUBLIC_PORTAL_GROUP_NAME || 'gportal_api_services';

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
      referer: process.env.NEXT_PUBLIC_APP_URL || '',
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

// Search for map services in the configured group only
async function findMapServicesInGroups(token: string) {
  try {
    // Find the group with the configured title
    const groupsUrl = `${portalUrl}/sharing/rest/community/groups?f=json&q=title:"${groupName}"&token=${token}&num=1`;
    const groupsResponse = await fetch(groupsUrl);
    if (!groupsResponse.ok) {
      throw new Error(`Failed to fetch groups: ${groupsResponse.status}`);
    }
    const groupsData = await groupsResponse.json();
    if (groupsData.error) {
      throw new Error(`Portal API error: ${groupsData.error.message}`);
    }

    const group = groupsData.results && groupsData.results[0];
    if (!group) {
      return {
        totalGroups: 0,
        groupsWithServices: [],
        totalServices: 0,
        mapServices: [],
        serviceMap: {},
        error: `Group "${groupName}" not found`
      };
    }

    // Fetch items from the group
    const itemsUrl = `${portalUrl}/sharing/rest/content/groups/${group.id}?f=json&token=${token}`;
    const itemsResponse = await fetch(itemsUrl);
    if (!itemsResponse.ok) {
      throw new Error(`Failed to fetch items for group: ${itemsResponse.status}`);
    }
    const itemsData = await itemsResponse.json();

    const allServices: any[] = [];
    const serviceMap: { [key: string]: string } = {};
    const groupsWithServices: any[] = [];

    if (itemsData.items && Array.isArray(itemsData.items)) {
      const mapServices = itemsData.items.filter((item: any) =>
        item.type === 'Map Service' && item.url
      );

      if (mapServices.length > 0) {
        groupsWithServices.push({
          ...group,
          mapServices: mapServices.length
        });

        mapServices.forEach((item: any) => {
          // Extract service name from URL
          const urlParts = item.url.split('/');
          const serviceIndex = urlParts.findIndex((part: string) => part === 'services');
          if (serviceIndex !== -1 && serviceIndex + 1 < urlParts.length) {
            const serviceName = urlParts[serviceIndex + 1];

            // Avoid duplicates by checking if service name already exists
            if (!serviceMap[serviceName]) {
              serviceMap[serviceName] = item.url;
              allServices.push({
                name: serviceName,
                title: item.title || serviceName,
                url: item.url,
                groupTitle: group.title,
                groupId: group.id,
                proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mapservice/${serviceName}/MapServer`
              });
            }
          }
        });
      }
    }

    return {
      totalGroups: 1,
      groupsWithServices,
      totalServices: allServices.length,
      mapServices: allServices,
      serviceMap
    };
  } catch (error) {
    console.error('Error finding map services:', error);
    return { error: String(error) };
  }
}

export async function GET() {
  try {
    const token = await getToken();
    if (!token) {
      return new NextResponse('Failed to authenticate with ArcGIS Portal', { status: 500 });
    }

    const result = await findMapServicesInGroups(token);

    if (result.error) {
      return new NextResponse('Error: ' + result.error, { status: 500 });
    }

    // Build HTML dictionary
    let html = `
      <html>
        <head>
          <title>Available Map Services</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 2em; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background: #f4f4f4; }
            a { color: #0070f3; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Available Map Services</h1>
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Title</th>
                <th>Proxy Link</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (Array.isArray(result.mapServices)) {
      for (const svc of result.mapServices) {
        html += `
          <tr>
            <td>${svc.name}</td>
            <td>${svc.title}</td>
            <td><a href="${svc.proxyUrl}" target="_blank">${svc.proxyUrl}</a></td>
          </tr>
        `;
      }
    }

    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('API error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
