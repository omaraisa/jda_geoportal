import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/token';

const protectedPaths = [
    '/',
    '/api',
];

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || '/';
const REFRESH_PATH = process.env.NEXT_PUBLIC_AUTH_REFRESH_URL || '/';  

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
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
                    const callbackUrl = encodeURIComponent(request.url);
                    const refreshUrl = new URL(REFRESH_PATH, AUTH_BASE_URL);
                    refreshUrl.searchParams.set('callback', callbackUrl);
                    
                    return NextResponse.redirect(refreshUrl);
                }
            }
            
            const callbackUrl = encodeURIComponent(request.url);
            const loginUrl = new URL(AUTH_BASE_URL);
            loginUrl.searchParams.set('callback', callbackUrl);
            
            return NextResponse.redirect(loginUrl);
        }
        
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL(AUTH_BASE_URL));
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.png$).*)'],
};
