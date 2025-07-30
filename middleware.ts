import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/utils/token';

const protectedPaths = [
    '/',
    '/api',
];

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || '/';
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || '/';

export async function middleware(request: NextRequest) {
    // const path = request.nextUrl.pathname;

    // try {
    //     if (protectedPaths.some(p => path === p || path.startsWith(p))) {
    //         const accessToken = request.cookies.get('access_token')?.value;
    //         const refreshToken = request.cookies.get('refresh_token')?.value;

    //         if (accessToken) {
    //             const payload = await verifyAccessToken(accessToken);
    //             if (payload) {
    //                 const requestHeaders = new Headers(request.headers);
    //                 requestHeaders.set('x-user-role', payload.role);

    //                 return NextResponse.next({
    //                     request: {
    //                         headers: requestHeaders,
    //                     },
    //                 });
    //             }
    //         }

    //         if (refreshToken) {
    //             try {
    //                 const refreshResponse = await fetch(`${APP_BASE_URL}/api/refresh-token`, {
    //                     method: 'POST',
    //                     headers: {
    //                         'Cookie': `refresh_token=${refreshToken}`,
    //                     },
    //                 });

    //                 if (refreshResponse.ok) {
    //                     const requestHeaders = new Headers(request.headers);
    //                     const setCookieHeaders = refreshResponse.headers.getSetCookie();
                        
    //                     const response = NextResponse.next({
    //                         request: {
    //                             headers: requestHeaders,
    //                         },
    //                     });

    //                     setCookieHeaders.forEach(cookieHeader => {
    //                         response.headers.append('Set-Cookie', cookieHeader);
    //                     });

    //                     return response;
    //                 } else {
    //                     return NextResponse.redirect(new URL(AUTH_BASE_URL));
    //                 }
    //             } catch (error) {
    //                 console.error('Failed to refresh token:', error);
    //                 return NextResponse.redirect(new URL(AUTH_BASE_URL));
    //             }
    //         }

    //         const callbackUrl = encodeURIComponent(`${APP_BASE_URL}${path}`);
    //         const loginUrl = new URL(AUTH_BASE_URL);
    //         loginUrl.searchParams.set('callback', callbackUrl);

    //         return NextResponse.redirect(loginUrl);
    //     }

    //     return NextResponse.next();
    // } catch (error) {
    //     console.error('Middleware error:', error);
    //     return NextResponse.redirect(new URL(AUTH_BASE_URL));
    // }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\.png$).*)'],
};
