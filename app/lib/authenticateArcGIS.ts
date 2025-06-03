'use client';

import type EsriConfig from '@arcgis/core/config';
import type IdentityManagerType from '@arcgis/core/identity/IdentityManager';
import type ServerInfoType from '@arcgis/core/identity/ServerInfo';
import { getCookie } from './token';

let esriConfig: typeof EsriConfig | undefined;
let IdentityManager: typeof IdentityManagerType | undefined;
let ServerInfo: typeof ServerInfoType | undefined;

let initializationPromise: Promise<void> | null = null;
let modulesLoaded = false;

// Module-level token storage
let currentToken: string | null = null;
let tokenExpiry: number | null = null;

const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
    username: process.env.NEXT_PUBLIC_PORTAL_USERNAME ?? '',
    password: process.env.NEXT_PUBLIC_PORTAL_PASSWORD ?? '',
};

// Function to get current token, generate if needed
export const getArcGISToken = async (): Promise<string | null> => {
    // Check if we have a valid token in memory
    if (currentToken && tokenExpiry) {
        const timeUntilExpiry = tokenExpiry - Date.now();
        
        if (timeUntilExpiry > 2 * 60 * 1000) { // 2-minute buffer
            // Token is still valid
            return currentToken;
        } else {
            // Token is expired or expiring soon
            currentToken = null;
            tokenExpiry = null;
        }
    }
    
    // Check cookies for existing token
    const cookieToken = getCookie('arcgis_token');
    const cookieExpiry = getCookie('arcgis_token_expiry');
    
    if (cookieToken && cookieExpiry) {
        const expiry = parseInt(cookieExpiry, 10);
        
        // Check if expiry value is reasonable (not corrupted)
        if (isNaN(expiry) || expiry > Date.now() + (365 * 24 * 60 * 60 * 1000)) {
            // Cookie expiry value appears corrupted, clearing cookies
            document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } else {
            const timeUntilExpiry = expiry - Date.now();
            
            if (timeUntilExpiry > 2 * 60 * 1000) { // 2-minute buffer
                // Cookie token is still valid, updating module variables
                currentToken = cookieToken;
                tokenExpiry = expiry;
                return currentToken;
            } else {
                // Cookie token is expired or expiring soon
                document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
        }
    }
    
    // Generate new token if needed
    const success = await authenticateArcGIS();
    return success ? currentToken : null;
};

// Function to clear token
export const clearArcGISToken = (): void => {
    currentToken = null;
    tokenExpiry = null;
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
        modulesLoaded = false;
        throw new Error(`Failed to load ArcGIS modules: ${error}`);
    }
}

export const initializeArcGIS = async (): Promise<void> => {
    if (typeof window === 'undefined') {
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
            initializationPromise = null;
            throw error;
        }
    })();

    return initializationPromise;
};

export const isArcgisTokenValid = (): boolean => {
    if (typeof document === 'undefined') {
        return false;
    }

    // Check module-level token first
    if (currentToken && tokenExpiry) {
        const isValid = Date.now() < tokenExpiry - 2 * 60 * 1000;
        if (isValid) {
            return true;
        } else {
            // Clear expired module token
            currentToken = null;
            tokenExpiry = null;
        }
    }

    // Check cookies as fallback
    const arcgisToken = getCookie('arcgis_token');
    const arcgisTokenExpiry = getCookie('arcgis_token_expiry');

    if (!arcgisToken || !arcgisTokenExpiry) {
        return false;
    }

    try {
        const expiryTime = parseInt(arcgisTokenExpiry, 10);
        const isValid = Date.now() < expiryTime - 2 * 60 * 1000;
        
        if (!isValid) {
            // Clear expired cookies
            document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        return isValid;
    } catch (error) {
        console.error('Error checking ArcGIS token validity:', error);
        return false;
    }
};

export const authenticateArcGIS = async (): Promise<boolean> => {
    try {
        if (typeof document === 'undefined') {
            console.warn('Cannot authenticate ArcGIS on the server.');
            return false;
        }

        const { username, password } = config;
        
        if (!username || !password) {
            console.warn('ArcGIS credentials not configured in environment variables');
            return false;
        }

        try {
            if (config.tokenServiceUrl === 'PORTAL_TOKEN_NOT_SET') {
                console.error('Cannot authenticate: Token Service URL is not configured.');
                return false;
            }

            if (!IdentityManager) {
                const idManMod = await import('@arcgis/core/identity/IdentityManager');
                IdentityManager = idManMod.default;
            }

            const refererUrl = process.env.NEXT_PUBLIC_GEOPORTAL_URL || window.location.origin;
            
            const params = new URLSearchParams({
                username,
                password,
                client: 'referer',
                referer: "localhost:3000",
                f: 'json',
            });

            const tokenResponse = await fetch(
                config.tokenServiceUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString(),
                }
            );

            const tokenData = await tokenResponse.json();

            if (tokenData.error) {
                console.error('ArcGIS Token Error:', tokenData.error);
                return false;
            }

            // Calculate expiry time
            const expiryTime = tokenData.expires * 1000;
            
            // Store token in module variables
            currentToken = tokenData.token;
            tokenExpiry = expiryTime;

            // Store token in cookie
            document.cookie = `arcgis_token=${tokenData.token}; path=/; secure; samesite=strict`;
            document.cookie = `arcgis_token_expiry=${expiryTime}; path=/; secure; samesite=strict`;
            
            // Save token to state store
            const { default: useStateStore } = await import('../stateStore');
            useStateStore.getState().setGisToken(tokenData.token);
            
            // Test the token with the same referer
            try {
                const testUrl = `${config.portalUrl}/sharing/rest/portals/self?f=json&token=${tokenData.token}`;
                
                const testResponse = await fetch(testUrl, {
                    headers: {
                        'Referer': refererUrl
                    }
                });
                const testData = await testResponse.json();
                
                if (testData.error) {
                    console.error('Token test failed:', testData.error);
                    // Automatically generate a new token if validation fails
                    const success = await authenticateArcGIS();
                    return success;
                }
                
                // Token test successful
            } catch (testError) {
                console.error('Token test error:', testError);
                // Automatically generate a new token if validation fails
                const success = await authenticateArcGIS();
                return success;
            }

            // Register with IdentityManager
            if (IdentityManager && config.portalUrl) {
                try {
                    if (!ServerInfo) {
                        const serverInfoMod = await import('@arcgis/core/identity/ServerInfo');
                        ServerInfo = serverInfoMod.default;
                    }
                    
                    const serverInfo = new ServerInfo({
                        server: config.portalUrl,
                        tokenServiceUrl: config.tokenServiceUrl,
                    });

                    IdentityManager.registerToken({
                        server: config.portalUrl,
                        token: tokenData.token,
                        expires: expiryTime,
                        userId: username
                    });

                    IdentityManager.registerServers([serverInfo]);
                } catch (error) {
                    console.error('Failed to register token with IdentityManager:', error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('ArcGIS authentication with credentials failed:', error);
            currentToken = null;
            tokenExpiry = null;
            return false;
        }
    } catch (error) {
        console.error('ArcGIS Authentication failed:', error);
        currentToken = null;
        tokenExpiry = null;
        return false;
    }
};

export const refreshArcGISTokenIfNeeded = async (): Promise<boolean> => {
    try {
        // Use the updated getArcGISToken function which handles validation
        const token = await getArcGISToken();
        return !!token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
};

export const fetchArcGISUserInfo = async () => {
    if (typeof document === 'undefined') return null;

    const accessToken = getCookie('access_token');
    if (!accessToken) {
        return null;
    }

    try {
        // Use environment variables for ArcGIS authentication
        const username = config.username;
        const password = config.password;
        
        if (!username || !password) {
            console.warn('ArcGIS credentials not configured in environment variables');
            return null;
        }
        
        if (config.tokenServiceUrl === 'PORTAL_TOKEN_NOT_SET') {
            console.error('Cannot fetch user info: Token Service URL is not configured.');
            return null;
        }
        
        const params = new URLSearchParams({
            username,
            password,
            client: 'referer',
            referer: window.location.origin,
            f: 'json',
        });

        const tokenResponse = await fetch(
            config.tokenServiceUrl,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('ArcGIS Token Error:', tokenData.error);
            return null;
        }

        const expiryTime = Date.now() + (tokenData.expires * 1000);
        document.cookie = `arcgis_token=${tokenData.token}; path=/; secure; samesite=strict`;
        document.cookie = `arcgis_token_expiry=${expiryTime}; path=/; secure; samesite=strict`;

        const userGroupsUrl = `${config.portalUrl}/sharing/rest/community/self?f=json&token=${tokenData.token}`;
        const groupsResponse = await fetch(userGroupsUrl);
        const userData = await groupsResponse.json();

        if (userData.error) {
            console.error('Error fetching user data from portal:', userData.error);
            return null;
        }

        // Use userData from ArcGIS portal response
        const userInfo = {
            fullName: userData.fullName || username,
            username: userData.username || username,
            role: 'viewer', // Default role, will be updated by authorization
            groups: userData.groups || []
        };
        
        return userInfo;
    } catch (error) {
        console.error('Failed to fetch ArcGIS user info:', error);
        return null;
    }
};
