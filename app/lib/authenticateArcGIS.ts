'use client';

import esriConfig from '@arcgis/core/config';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import ServerInfo from '@arcgis/core/identity/ServerInfo';

const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    username: process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_USERNAME ?? 'USERNAME_NOT_SET',
    password: process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_PASSWORD ?? 'PASSWORD_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
};

esriConfig.apiKey = config.apiKey;

const serverInfo = new ServerInfo({
    server: config.portalUrl,
    tokenServiceUrl: config.tokenServiceUrl,
});

IdentityManager.registerServers([serverInfo]);

export const authenticateArcGIS = async () => {
    try {
        const response = await IdentityManager.generateToken(serverInfo, {
            username: config.username,
            password: config.password,
            client: 'referer',
            referer: window.location.origin,
        });

        IdentityManager.registerToken({
            server: serverInfo.server,
            token: response.token,
            expires: response.expires,
        });

        return true;
    } catch (error) {
        console.error('ArcGIS Authentication failed:', error);
        return false;
    }
};
