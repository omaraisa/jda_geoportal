'use client';

// Import types for better intellisense and type checking
import type EsriConfig from '@arcgis/core/config';
import type IdentityManagerType from '@arcgis/core/identity/IdentityManager';
import type ServerInfoType from '@arcgis/core/identity/ServerInfo';

// Module-level variables to hold the loaded modules
let esriConfig: typeof EsriConfig | undefined;
let IdentityManager: typeof IdentityManagerType | undefined;
let ServerInfo: typeof ServerInfoType | undefined;

// Promise to track the loading and initialization state
let initializationPromise: Promise<void> | null = null;
let modulesLoaded = false; // Flag to quickly check if modules finished loading

// Configuration object (consider fetching these securely if possible)
const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
};

// Helper function to load necessary ArcGIS modules dynamically
async function loadArcGISModules(): Promise<void> {
    // Only load modules if they haven't been loaded yet and we are on the client-side
    if (modulesLoaded || typeof window === 'undefined') {
        return;
    }

    // console.log('Loading ArcGIS modules...');
    try {
        // Use Promise.all to load modules concurrently
        const [configMod, idManMod, serverInfoMod] = await Promise.all([
            import('@arcgis/core/config'),
            import('@arcgis/core/identity/IdentityManager'),
            import('@arcgis/core/identity/ServerInfo')
        ]);

        // Assign the default exports to our module-level variables
        esriConfig = configMod.default;
        IdentityManager = idManMod.default;
        ServerInfo = serverInfoMod.default;

        modulesLoaded = true; // Mark modules as successfully loaded
        // console.log('ArcGIS modules loaded successfully.');

    } catch (error) {
        console.error('Failed to load essential ArcGIS modules:', error);
        modulesLoaded = false; // Ensure flag reflects failure
        // Re-throw the error so the caller (initializeArcGIS) knows loading failed
        throw new Error(`Failed to load ArcGIS modules: ${error}`);
    }
}

/**
 * Initializes ArcGIS configuration and registers the portal server.
 * Ensures modules are loaded before attempting configuration.
 * This function is idempotent - safe to call multiple times.
 */
export const initializeArcGIS = async (): Promise<void> => {
    // Prevent execution on the server side
    if (typeof window === 'undefined') {
        console.warn('ArcGIS initialization skipped: running on server.');
        return;
    }

    // If initialization is already in progress or completed, return the existing promise
    if (initializationPromise) {
        // console.log('ArcGIS initialization already in progress or completed. Awaiting...');
        return initializationPromise;
    }

    // console.log('Starting ArcGIS initialization...');

    // Create the promise to handle the initialization flow
    initializationPromise = (async () => {
        try {
            // Step 1: Ensure modules are loaded
            await loadArcGISModules();

            // Step 2: Check if modules loaded successfully before proceeding
            if (!modulesLoaded || !esriConfig || !IdentityManager || !ServerInfo) {
                // This case should ideally be caught by loadArcGISModules re-throwing
                throw new Error('ArcGIS modules are not available for initialization.');
            }

            // Step 3: Configure the API Key
            if (config.apiKey !== 'API_KEY_NOT_SET') {
                 esriConfig.apiKey = config.apiKey;
                 // console.log('ArcGIS API Key configured.');
            } else {
                 console.warn('ArcGIS API Key is not set. Using default or potentially falling back to other auth methods.');
            }


            // Step 4: Create ServerInfo instance IF portalUrl is valid
            // Check if portalUrl and tokenServiceUrl are set correctly
            if (config.portalUrl === 'PORTAL_URL_NOT_SET' || config.tokenServiceUrl === 'PORTAL_TOKEN_NOT_SET') {
                 console.warn('Portal URL or Token Service URL is not set. Skipping server registration with IdentityManager.');
                 // Depending on your app's needs, you might want to throw an error here
                 // if portal access is strictly required.
            } else {
                // console.log(`Creating ServerInfo for Portal: ${config.portalUrl}`);
                const serverInfo = new ServerInfo({
                    server: config.portalUrl,
                    tokenServiceUrl: config.tokenServiceUrl,
                });

                // Step 5: Register the server with IdentityManager
                // Defensive check for the function's existence
                if (typeof IdentityManager.registerServers === 'function') {
                    IdentityManager.registerServers([serverInfo]);
                    // console.log('Server registered with IdentityManager.');
                } else {
                    // This shouldn't happen if the module loaded correctly, but good to check
                    console.error('IdentityManager.registerServers function is unexpectedly missing!');
                    throw new Error('IdentityManager is loaded but registerServers is missing.');
                }
            }

            // console.log('ArcGIS initialized successfully.');

        } catch (error) {
            console.error('ArcGIS initialization failed:', error);
            // Reset promise on failure to allow potential retries if desired
            // Or keep it rejected to signal permanent failure: initializationPromise = Promise.reject(error);
            initializationPromise = null;
            throw error; // Re-throw error so the caller knows initialization failed
        }
    })(); // Immediately invoke the async IIFE

    return initializationPromise;
};

// --- Utility Functions (potentially improved) ---

function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    // Decode cookie components to handle encoded characters (like URLs)
    const cookies = Object.fromEntries(
        document.cookie.split('; ').map(c => {
            const [key, ...val] = c.split('=');
            // Basic decoding, adjust if needed for specific encoding
            return [decodeURIComponent(key), decodeURIComponent(val.join('='))];
        })
    );
    return cookies[name];
}

/**
 * Checks if the stored ArcGIS token is present and not expiring soon.
 */
export const isArcgisTokenValid = (): boolean => {
    if (typeof document === 'undefined') {
        return false;
    }

    const token = getCookie('arcgis_token');
    const expires = getCookie('arcgis_token_expiry'); // Expects Unix timestamp (milliseconds)

    if (!token || !expires) {
        // // console.log('Token or expiry cookie missing.'); // Optional debug log
        return false;
    }

    const minute = 60 * 1000;
    const expiryTime = parseInt(expires, 10); // Explicit radix

    // Check if expires is a valid number
    if (isNaN(expiryTime)) {
        console.warn('Invalid ArcGIS token expiry time found in cookie:', expires);
        return false;
    }

    // Check if the token expires within the next 3 minutes
    const isValid = Date.now() < expiryTime - 3 * minute;
    // // console.log(`Token validity check: Now=${Date.now()}, Expires=${expiryTime}, Valid=${isValid}`); // Optional debug log
    return isValid;
};

/**
 * Registers the token from cookies with the IdentityManager.
 * Ensures ArcGIS is initialized before attempting registration.
 */
export const authenticateArcGIS = async (): Promise<boolean> => {
    try {
        if (typeof document === 'undefined') {
             console.warn('Cannot authenticate ArcGIS on the server.');
            return false;
        }

        // Crucial: Ensure initialization is complete before proceeding
        // This will also handle loading the modules if not done yet.
        await initializeArcGIS();

        // After awaiting, double-check if IdentityManager is available (it should be if init succeeded)
         if (!IdentityManager) {
             console.error('IdentityManager not available after initialization for authentication.');
             return false;
         }


        const hour = 60 * 60 * 1000;
        const token = getCookie('arcgis_token');
        const expiresCookie = getCookie('arcgis_token_expiry');

        if (!token) {
            // console.log('No ArcGIS token found in cookies for authentication.');
            return false; // No token to register
        }

        // Validate or set default expiry time
        let expiryTime: number;
        if (expiresCookie) {
            const parsedExpires = parseInt(expiresCookie, 10);
            // Use parsed time if valid, otherwise default to 2 hours from now
            expiryTime = !isNaN(parsedExpires) ? parsedExpires : Date.now() + 2 * hour;
             if (isNaN(parsedExpires)) {
                 console.warn(`Invalid expiry cookie value "${expiresCookie}", using default.`);
             }
        } else {
            console.warn('Expiry cookie missing, using default 2-hour expiry.');
            expiryTime = Date.now() + 2 * hour; // Default expiry if cookie is missing
        }

        // Check again if portalUrl is valid before registering token for it
        if (config.portalUrl === 'PORTAL_URL_NOT_SET') {
            console.error('Cannot register token: Portal URL is not configured.');
            return false;
        }

        // Register the token
        if (typeof IdentityManager.registerToken === 'function') {
            IdentityManager.registerToken({
                server: config.portalUrl, // Use the configured portal URL
                token: token,
                expires: expiryTime, // Use the determined expiry time
            });
            // console.log('ArcGIS token registered with IdentityManager.');
            return true;
        } else {
            console.error('IdentityManager.registerToken function is unexpectedly missing!');
            return false;
        }
    } catch (error) {
        // Catch errors from initializeArcGIS or token registration
        console.error('ArcGIS Authentication failed:', error);
        return false;
    }
};

/**
 * Fetches user information from the ArcGIS portal using the token from cookies.
 */
export const fetchArcGISUserInfo = async () => {
    if (typeof document === 'undefined') return null;

    const token = getCookie('arcgis_token');
    if (!token) {
        // console.log('No ArcGIS token found for fetching user info.');
        return null;
    }

    // Ensure Portal URL is configured
    if (!config.portalUrl || config.portalUrl === 'PORTAL_URL_NOT_SET') {
         console.error('Portal URL is not configured. Cannot fetch user info.');
         return null;
    }

    const userInfoUrl = `${config.portalUrl}/sharing/rest/community/self?f=json&token=${token}`;

    try {
        // console.log('Fetching ArcGIS user info from:', userInfoUrl); // Avoid logging token
        const response = await fetch(userInfoUrl);

        if (!response.ok) {
            // Attempt to parse error details from ArcGIS Portal response
            let errorDetails = `HTTP status ${response.status}`;
            try {
                const errorJson = await response.json();
                if (errorJson.error) {
                    errorDetails = `Code ${errorJson.error.code}: ${errorJson.error.message}`;
                    // Common error: 498 Invalid Token
                    if (errorJson.error.code === 498) {
                         console.warn('ArcGIS token is invalid or expired. User info fetch failed.');
                         // Consider triggering re-authentication flow here
                    }
                }
            } catch (e) { /* Ignore JSON parsing error if response wasn't JSON */ }
            throw new Error(`Failed to fetch user info. ${errorDetails}`);
        }

        const userInfo = await response.json();

        // Handle potential errors returned within a 200 OK response's JSON body
        if (userInfo.error) {
            throw new Error(`ArcGIS API Error: ${userInfo.error.message || 'Unknown error'}`);
        }

        // Basic validation of expected user info fields
        if (!userInfo.username) {
             console.warn('Fetched user info is missing username field.');
             // Depending on requirements, might want to return null or throw an error
        }

        // console.log('Successfully fetched user info for:', userInfo.username);
        return {
            fullName: userInfo.fullName || '', // Provide defaults for potentially missing fields
            username: userInfo.username,
            email: userInfo.email || '',     // Add email if needed/available
            role: userInfo.role || 'unknown', // e.g., 'org_admin', 'org_publisher', 'org_user'
            groups: userInfo.groups || [],    // Array of group objects user belongs to
            // Add other fields as needed: e.g., thumbnail: userInfo.thumbnail
        };
    } catch (error) {
        console.error('Failed to fetch ArcGIS user info:', error);
        return null; // Return null on any failure
    }
};