import * as jose from 'jose';

export interface TokenPayload {
    userId: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    iat: number;
    exp: number;
}

export interface RefreshTokenPayload extends TokenPayload {
    tokenVersion: number;
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
        const secret = process.env.NEXT_PUBLIC_TOKEN_SECRET;
        if (!secret) {
            console.error("TOKEN_SECRET not configured in environment");
            return null;
        }
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(secret);
        const { payload } = await jose.jwtVerify(token, secretKey);
        return payload as unknown as TokenPayload;
    } catch (error) {
        console.error("Token verification failed:", error);
        console.error("Token:", token.substring(0, 50) + "...");
        return null;
    }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
        const secret = process.env.NEXT_PUBLIC_TOKEN_SECRET;
        if (!secret) {
            console.error("TOKEN_SECRET is not defined in environment variables");
            return null;
        }
        const encoder = new TextEncoder();
        const secretKey = encoder.encode(secret);
        const { payload } = await jose.jwtVerify(token, secretKey);
        return payload as unknown as RefreshTokenPayload;
    } catch (error) {
        console.error("Refresh token verification failed:", error);
        return null;
    }
}

export function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => {
            const [key, ...val] = c.split('=');
            return [key, val.join('=')].map(decodeURIComponent);
        })
    );
    return cookies[name];
}
