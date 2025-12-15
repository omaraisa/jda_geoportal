'use client';

import type EsriConfig from '@arcgis/core/config';
import type IdentityManagerType from '@arcgis/core/identity/IdentityManager';
import type ServerInfoType from '@arcgis/core/identity/ServerInfo';
import { getCookie } from './token';
import { AUTH_CONFIG, getCurrentConfig } from './auth-config';

let esriConfig: typeof EsriConfig | undefined;
let IdentityManager: typeof IdentityManagerType | undefined;
let ServerInfo: typeof ServerInfoType | undefined;

let initializationPromise: Promise<void> | null = null;
let modulesLoaded = false;

let currentToken: string | null = null;
let tokenExpiry: number | null = null;

const config = {
    apiKey: process.env.NEXT_PUBLIC_ARCGIS_API_KEY ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    // Remove tokenServiceUrl from client-side config - not needed for our backend-only auth approach
};


export const getArcGISToken = async (): Promise<string | null> => {
    const authConfig = getCurrentConfig();
    const bufferMs = authConfig.SESSION_MODAL_BUFFER * 1000;
    
    if (currentToken && tokenExpiry) {
        const timeUntilExpiry = tokenExpiry - Date.now();
        if (timeUntilExpiry > bufferMs) {
            return currentToken;
        } else {
            currentToken = null;
            tokenExpiry = null;
        }
    }
    
    const cookieToken = getCookie('arcgis_token');
    const cookieExpiry = getCookie('arcgis_token_expiry');
    
    if (cookieToken && cookieExpiry) {
        const expiry = parseInt(cookieExpiry, 10);
        if (isNaN(expiry) || expiry > Date.now() + (365 * 24 * 60 * 60 * 1000)) {
            document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } else {
            const timeUntilExpiry = expiry - Date.now();
            if (timeUntilExpiry > bufferMs) {
                currentToken = cookieToken;
                tokenExpiry = expiry;
                // Register token with IdentityManager (use token service root)
                if (IdentityManager && config.portalUrl) {
                    const trimmedPortal = config.portalUrl.replace(/\/$/, '');
                    const tokenServiceRoot = `${trimmedPortal}/sharing/rest`;
                    IdentityManager.registerToken({
                        server: tokenServiceRoot,
                        token: cookieToken,
                        expires: expiry,
                        userId: ''
                    });
                }
                return currentToken;
            } else {
                document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
        }
    }
    
    const success = await authenticateArcGIS();
    return success ? currentToken : null;
};

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
                console.warn('🔑 ArcGIS API Key is not set. Using default or potentially falling back to other auth methods.');
            }

            // Since we're using backend-only authentication, we don't need to register servers
            // with IdentityManager. The client-side code will get tokens from our API.
            if (config.portalUrl === 'PORTAL_URL_NOT_SET') {
                 console.warn('Portal URL is not set. ArcGIS integration may not work properly.');
            } else {
                // Optional: Register server without token service URL for basic connectivity
                // This allows ArcGIS widgets to know about the portal without handling auth
                try {
                    const trimmedPortal = config.portalUrl.replace(/\/$/, '');
                    const tokenServiceUrl = `${trimmedPortal}/sharing/rest/generateToken`;
                    const tokenServiceRoot = `${trimmedPortal}/sharing/rest`;

                    const serverInfo = new ServerInfo({
                        server: config.portalUrl,
                        tokenServiceUrl: tokenServiceUrl,
                    });

                    if (typeof IdentityManager.registerServers === 'function') {
                        IdentityManager.registerServers([serverInfo]);
                        // Ensure IdentityManager has the token service url available
                        // console.log('✅ ArcGIS server registered (auth handled by backend)');
                    }
                } catch (error) {
                    console.warn('Failed to register ArcGIS server (non-critical):', error);
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

    const authConfig = getCurrentConfig();
    const bufferMs = authConfig.SESSION_MODAL_BUFFER * 1000;

    if (currentToken && tokenExpiry) {
        const isValid = Date.now() < tokenExpiry - bufferMs;
        if (isValid) {
            return true;
        } else {
            currentToken = null;
            tokenExpiry = null;
        }
    }

    const arcgisToken = getCookie('arcgis_token');
    const arcgisTokenExpiry = getCookie('arcgis_token_expiry');

    if (!arcgisToken || !arcgisTokenExpiry) {
        return false;
    }

    try {
        const expiryTime = parseInt(arcgisTokenExpiry, 10);
        const isValid = Date.now() < expiryTime - bufferMs;
        
        if (!isValid) {
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

        try {
            const response = await fetch('/api/authenticate-arcgis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                console.error('ArcGIS Token Error:', data.error);
                return false;
            }

            const authConfig = getCurrentConfig();
            const expiryTime = Date.now() + authConfig.TOKEN_DURATION_MINUTES * 60 * 1000;

            currentToken = data.token;
            tokenExpiry = expiryTime;

            document.cookie = `arcgis_token=${data.token}; path=/; secure; samesite=strict`;
            document.cookie = `arcgis_token_expiry=${expiryTime}; path=/; secure; samesite=strict`;
            
            const { default: useStateStore } = await import('../../stateStore');
            useStateStore.getState().setGisToken(data.token);
            
            // Test the token (optional, since API already tested)
            try {
                const testUrl = `${config.portalUrl}/sharing/rest/portals/self?f=json&token=${data.token}`;
                const refererUrl = process.env.NEXT_PUBLIC_APP_URL_SDF_GEOAPP || window.location.origin;
                
                const testResponse = await fetch(testUrl, {
                    headers: {
                        'Referer': refererUrl
                    }
                });
                const testData = await testResponse.json();
                if (testData.error) {
                    console.error('Token test failed:', testData.error);
                    return false;
                }
            } catch (testError) {
                console.error('Token test error:', testError);
                return false;
            }

            if (IdentityManager && config.portalUrl) {
                try {
                    if (!ServerInfo) {
                        const serverInfoMod = await import('@arcgis/core/identity/ServerInfo');
                        ServerInfo = serverInfoMod.default;
                    }
                    const trimmedPortal = config.portalUrl.replace(/\/$/, '');
                    const tokenServiceUrl = `${trimmedPortal}/sharing/rest/generateToken`;
                    const tokenServiceRoot = `${trimmedPortal}/sharing/rest`;

                    const serverInfo = new ServerInfo({
                        server: config.portalUrl,
                        tokenServiceUrl: tokenServiceUrl,
                    });

                    // Register token against the token service root so IdentityManager
                    // has a valid server url when attempting to generate or refresh tokens
                    IdentityManager.registerToken({
                        server: tokenServiceRoot,
                        token: data.token,
                        expires: expiryTime,
                        userId: '' // No username needed
                    });

                    IdentityManager.registerServers([serverInfo]);
                } catch (error) {
                    console.error('Failed to register token with IdentityManager:', error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('ArcGIS authentication with API failed:', error);
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
        const token = await getArcGISToken();
        return !!token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
};
