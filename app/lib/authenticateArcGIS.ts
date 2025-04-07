'use client';

import esriConfig from '@arcgis/core/config';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import ServerInfo from '@arcgis/core/identity/ServerInfo';

const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
};

esriConfig.apiKey = config.apiKey;

const serverInfo = new ServerInfo({
    server: config.portalUrl,
    tokenServiceUrl: config.tokenServiceUrl,
});

IdentityManager.registerServers([serverInfo]);

function getCookie(name: string): string | undefined {
    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => c.split('='))
    );
    return cookies[name];
}



export const isArcgisTokenValid = (): boolean => {
    if (typeof document === 'undefined') {
        return false;
    }

    const token = getCookie('arcgis_token');
    const expires = getCookie('arcgis_token_expiry');

    if (!token || !expires) return false;

    const expiryTime = parseInt(expires);
    return Date.now() < expiryTime - 60000;
};

export const authenticateArcGIS = () => {
    try {
        if (typeof document === 'undefined') {
            return false;
        }

        const token = getCookie('arcgis_token');
        const expires = getCookie('arcgis_token_expiry');
        const expiryTime = expires ? parseInt(expires) : Date.now() + 60 * 60 * 1000;

        if (!token) {
            return false;
        }

        IdentityManager.registerToken({
            server: config.portalUrl,
            token: token,
            expires: expiryTime,
        });
        return true;
    } catch (error) {
        console.error('ArcGIS Authentication failed:', error);
        return false;
    }
};
