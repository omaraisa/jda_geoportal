import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/token';

const protectedPaths = [
    '/',
    '/api',
];

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || '/';
const REFRESH_PATH = process.env.NEXT_PUBLIC_AUTH_REFRESH_URL || '/';  
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Debug logging for environment variables
    console.log('Environment check:', {
        AUTH_BASE_URL,
        REFRESH_PATH,
        APP_BASE_URL,
        TOKEN_SECRET_LENGTH: process.env.TOKEN_SECRET?.length || 0
    });
    
    try {
        if (protectedPaths.some(p => path === p || path.startsWith(p))) {
            const accessToken = request.cookies.get('access_token')?.value;
            const refreshToken = request.cookies.get('refresh_token')?.value;
            
            if (accessToken) {
                const payload = await verifyAccessToken(accessToken);
                if (payload) {
                    const requestHeaders = new Headers(request.headers);
                    requestHeaders.set('x-user-role', payload.role);
                    
                    return NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    });
                }
            }
            
            if (refreshToken) {
                const refreshPayload = await verifyRefreshToken(refreshToken);
                
                if (refreshPayload) {
                    // Use APP_BASE_URL to construct the callback URL
                    const callbackUrl = encodeURIComponent(`${APP_BASE_URL}${path}`);
                    const refreshUrl = new URL(REFRESH_PATH, AUTH_BASE_URL);
                    refreshUrl.searchParams.set('callback', callbackUrl);
                    
                    return NextResponse.redirect(refreshUrl);
                }
            }
            
            // Use APP_BASE_URL to construct the callback URL
            const callbackUrl = encodeURIComponent(`${APP_BASE_URL}${path}`);
            const loginUrl = new URL(AUTH_BASE_URL);
            loginUrl.searchParams.set('callback', callbackUrl);
            
            return NextResponse.redirect(loginUrl);
        }
        
        return NextResponse.next();
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.redirect(new URL(AUTH_BASE_URL));
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.png$).*)'],
};
