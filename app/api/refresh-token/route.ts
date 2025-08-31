import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== REFRESH TOKEN API CALLED ===');
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    console.log('Refresh token present:', !!refreshToken);
    console.log('Refresh token length:', refreshToken?.length || 0);
    
    if (!refreshToken) {
      console.error('No refresh token found in cookies');
      return NextResponse.json(
        { message: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Make request to the auth server's refresh endpoint
    const authRefreshUrl = process.env.NEXT_PUBLIC_AUTH_REFRESH_URL || '';
    
    console.log('Auth refresh URL:', authRefreshUrl);
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_AUTH_REFRESH_URL: process.env.NEXT_PUBLIC_AUTH_REFRESH_URL,
      NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL
    });
    
    if (!authRefreshUrl || authRefreshUrl.includes('$(')) {
      console.error('Invalid auth refresh URL - environment variable not properly set');
      return NextResponse.json(
        { message: 'Configuration error' },
        { status: 500 }
      );
    }
    
    console.log('Making fetch request to:', authRefreshUrl);
    
    const response = await fetch(authRefreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`,
      },
      credentials: 'include',
    });

    console.log('Auth server response status:', response.status);
    console.log('Auth server response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth server error response:', errorText);
      console.error('Response status text:', response.statusText);
      return NextResponse.json(
        { message: 'Failed to refresh token', details: errorText },
        { status: 401 }
      );
    }

    const data = await response.json();
    console.log('Auth server success response data keys:', Object.keys(data));

    // Extract cookies from the auth server response
    const setCookieHeaders = response.headers.getSetCookie();
    console.log('Set-Cookie headers from auth server:', setCookieHeaders);
    
    // Create the response
    const nextResponse = NextResponse.json({ success: true, data });

    // Forward the cookies from the auth server
    setCookieHeaders.forEach(cookieHeader => {
      console.log('Forwarding cookie:', cookieHeader);
      nextResponse.headers.append('Set-Cookie', cookieHeader);
    });

    console.log('=== REFRESH TOKEN API SUCCESS ===');
    return nextResponse;

  } catch (error) {
    console.error('=== REFRESH TOKEN API ERROR ===');
    console.error('Token refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('Error name:', errorName);
    console.error('Error message:', errorMessage);
    
    if (error instanceof Error && 'cause' in error) {
      console.error('Error cause:', error.cause);
    }
    
    return NextResponse.json(
      { message: 'Authentication error', error: errorMessage },
      { status: 500 }
    );
  }
}
