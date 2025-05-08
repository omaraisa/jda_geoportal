'use client';

import type EsriConfig from '@arcgis/core/config';
import type IdentityManagerType from '@arcgis/core/identity/IdentityManager';
import type ServerInfoType from '@arcgis/core/identity/ServerInfo';

let esriConfig: typeof EsriConfig | undefined;
let IdentityManager: typeof IdentityManagerType | undefined;
let ServerInfo: typeof ServerInfoType | undefined;

let initializationPromise: Promise<void> | null = null;
let modulesLoaded = false;

const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
};

async function loadArcGISModules(): Promise<void> {
    if (modulesLoaded || typeof window === 'undefined') {
        return;
    }

    try {
        const [configMod, idManMod, serverInfoMod] = await Promise.all([
            import('@arcgis/core/config'),
            import('@arcgis/core/identity/IdentityManager'),
            import('@arcgis/core/identity/ServerInfo')
        ]);

        esriConfig = configMod.default;
        IdentityManager = idManMod.default;
        ServerInfo = serverInfoMod.default;

        modulesLoaded = true;

    } catch (error) {
        console.error('Failed to load essential ArcGIS modules:', error);
        modulesLoaded = false;
        throw new Error(`Failed to load ArcGIS modules: ${error}`);
    }
}

export const initializeArcGIS = async (): Promise<void> => {
    if (typeof window === 'undefined') {
        console.warn('ArcGIS initialization skipped: running on server.');
        return;
    }

    if (initializationPromise) {
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            await loadArcGISModules();

            if (!modulesLoaded || !esriConfig || !IdentityManager || !ServerInfo) {
                throw new Error('ArcGIS modules are not available for initialization.');
            }

            if (config.apiKey !== 'API_KEY_NOT_SET') {
                 esriConfig.apiKey = config.apiKey;
            } else {
                 console.warn('ArcGIS API Key is not set. Using default or potentially falling back to other auth methods.');
            }

            if (config.portalUrl === 'PORTAL_URL_NOT_SET' || config.tokenServiceUrl === 'PORTAL_TOKEN_NOT_SET') {
                 console.warn('Portal URL or Token Service URL is not set. Skipping server registration with IdentityManager.');
            } else {
                const serverInfo = new ServerInfo({
                    server: config.portalUrl,
                    tokenServiceUrl: config.tokenServiceUrl,
                });

                if (typeof IdentityManager.registerServers === 'function') {
                    IdentityManager.registerServers([serverInfo]);
                } else {
                    console.error('IdentityManager.registerServers function is unexpectedly missing!');
                    throw new Error('IdentityManager is loaded but registerServers is missing.');
                }
            }

        } catch (error) {
            console.error('ArcGIS initialization failed:', error);
            initializationPromise = null;
            throw error;
        }
    })();

    return initializationPromise;
};

function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => {
            const [key, ...val] = c.split('=');
            return [decodeURIComponent(key), decodeURIComponent(val.join('='))];
        })
    );
    return cookies[name];
}

export const isArcgisTokenValid = (): boolean => {
    if (typeof document === 'undefined') {
        return false;
    }

    const token = getCookie('arcgis_token');
    const expires = getCookie('arcgis_token_expiry');

    if (!token || !expires) {
        return false;
    }

    const minute = 60 * 1000;
    const expiryTime = parseInt(expires, 10);

    if (isNaN(expiryTime)) {
        console.warn('Invalid ArcGIS token expiry time found in cookie:', expires);
        return false;
    }

    const isValid = Date.now() < expiryTime - 3 * minute;
    return isValid;
};

export const authenticateArcGIS = async (): Promise<boolean> => {
    try {
        if (typeof document === 'undefined') {
             console.warn('Cannot authenticate ArcGIS on the server.');
            return false;
        }

        await initializeArcGIS();

         if (!IdentityManager) {
             console.error('IdentityManager not available after initialization for authentication.');
             return false;
         }


        const hour = 60 * 60 * 1000;
        const token = getCookie('arcgis_token');
        const expiresCookie = getCookie('arcgis_token_expiry');

        if (!token) {
            return false;
        }

        let expiryTime: number;
        if (expiresCookie) {
            const parsedExpires = parseInt(expiresCookie, 10);
            expiryTime = !isNaN(parsedExpires) ? parsedExpires : Date.now() + 2 * hour;
             if (isNaN(parsedExpires)) {
                 console.warn(`Invalid expiry cookie value "${expiresCookie}", using default.`);
             }
        } else {
            console.warn('Expiry cookie missing, using default 2-hour expiry.');
            expiryTime = Date.now() + 2 * hour;
        }

        if (config.portalUrl === 'PORTAL_URL_NOT_SET') {
            console.error('Cannot register token: Portal URL is not configured.');
            return false;
        }

        if (typeof IdentityManager.registerToken === 'function') {
            IdentityManager.registerToken({
                server: config.portalUrl,
                token: token,
                expires: expiryTime,
            });
            return true;
        } else {
            console.error('IdentityManager.registerToken function is unexpectedly missing!');
            return false;
        }
    } catch (error) {
        console.error('ArcGIS Authentication failed:', error);
        return false;
    }
};

export const fetchArcGISUserInfo = async () => {
    if (typeof document === 'undefined') return null;

    const token = getCookie('arcgis_token');
    if (!token) {
        return null;
    }

    if (!config.portalUrl || config.portalUrl === 'PORTAL_URL_NOT_SET') {
         console.error('Portal URL is not configured. Cannot fetch user info.');
         return null;
    }

    const userInfoUrl = `${config.portalUrl}/sharing/rest/community/self?f=json&token=${token}`;

    try {
        const response = await fetch(userInfoUrl);

        if (!response.ok) {
            let errorDetails = `HTTP status ${response.status}`;
            try {
                const errorJson = await response.json();
                if (errorJson.error) {
                    errorDetails = `Code ${errorJson.error.code}: ${errorJson.error.message}`;
                    if (errorJson.error.code === 498) {
                         console.warn('ArcGIS token is invalid or expired. User info fetch failed.');
                    }
                }
            } catch (e) { /* Ignore JSON parsing error if response wasn't JSON */ }
            throw new Error(`Failed to fetch user info. ${errorDetails}`);
        }

        const userInfo = await response.json();

        if (userInfo.error) {
            throw new Error(`ArcGIS API Error: ${userInfo.error.message || 'Unknown error'}`);
        }

        if (!userInfo.username) {
             console.warn('Fetched user info is missing username field.');
        }

        return {
            fullName: userInfo.fullName || '',
            username: userInfo.username,
            email: userInfo.email || '',
            org_role: userInfo.role || 'unknown',
            groups: userInfo.groups || [],
            role: 'viewer',
        };
    } catch (error) {
        console.error('Failed to fetch ArcGIS user info:', error);
        return null;
    }
};
