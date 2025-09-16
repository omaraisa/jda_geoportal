import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Make request to the auth server's refresh endpoint
    const authRefreshUrl = process.env.NEXT_PUBLIC_AUTH_REFRESH_URL || '';
    
    const response = await fetch(authRefreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refresh_token=${refreshToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Auth server error response:', errorText);
      return NextResponse.json(
        { message: 'Failed to refresh token' },
        { status: 401 }
      );
    }

    const data = await response.json();

    // Extract cookies from the auth server response
    const setCookieHeaders = response.headers.getSetCookie();
    
    // Create the response
    const nextResponse = NextResponse.json({ success: true });

    // Forward the cookies from the auth server
    setCookieHeaders.forEach(cookieHeader => {
      nextResponse.headers.append('Set-Cookie', cookieHeader);
    });

    return nextResponse;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { message: 'Authentication error' },
      { status: 500 }
    );
  }
}
