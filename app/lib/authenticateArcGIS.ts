'use client';
let esriConfig: any;
let IdentityManager: any;
let ServerInfo: any;

if (typeof window !== 'undefined') {
    import('@arcgis/core/config').then(mod => {
        esriConfig = mod.default;
    });
    import('@arcgis/core/identity/IdentityManager').then(mod => {
        IdentityManager = mod.default;
    });
    import('@arcgis/core/identity/ServerInfo').then(mod => {
        ServerInfo = mod.default;
    });
}

const config = {
    apiKey: process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET',
    portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET',
    tokenServiceUrl: process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET',
};

export const initializeArcGIS = () => {
    if (typeof window === 'undefined') {
        return;
    }
    if (!esriConfig || !config.apiKey) {
        console.warn('esriConfig or apiKey not available');
        return;
    }
    esriConfig.apiKey = config.apiKey;

    if (!ServerInfo) {
        console.warn('ServerInfo is not loaded');
        return;
    }

    let serverInfo;
    try {
        serverInfo = new ServerInfo({
            server: config.portalUrl,
            tokenServiceUrl: config.tokenServiceUrl,
        });
    } catch (err) {
        console.error('Failed to create ServerInfo:', err);
        return;
    }

    if (!IdentityManager || typeof IdentityManager.registerServers !== 'function') {
        console.warn('IdentityManager or registerServers not available');
        return;
    }

    try {
        IdentityManager.registerServers([serverInfo]);
    } catch (err) {
        console.error('Failed to register servers:', err);
    }
};


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

    const minute = 60 * 1000;
    const expiryTime = parseInt(expires);
    return Date.now() < expiryTime - 3 * minute;
};

export const authenticateArcGIS = () => {
    try {
        if (typeof document === 'undefined') {
            return false;
        }
        const hour = 60 * 60 * 1000;
        const token = getCookie('arcgis_token');
        const expires = getCookie('arcgis_token_expiry');
        const expiryTime = expires ? parseInt(expires) : Date.now() + 2 * hour;

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


export const fetchArcGISUserInfo = async () => {
    if (typeof document === 'undefined') return null;
  
    const token = getCookie('arcgis_token');
    if (!token) return null;
  
    try {
      const response = await fetch(
        `${config.portalUrl}/sharing/rest/community/self?f=json&token=${token}`
      );
      if (!response.ok) throw new Error('Failed to fetch user info');
  
      const userInfo = await response.json();
      return {
        fullName: userInfo.fullName,
        username: userInfo.username,
        role: userInfo.role,
        groups: userInfo.groups || [],
      };
    } catch (error) {
      console.error('Failed to fetch ArcGIS user info:', error);
      return null;
    }
  };
  