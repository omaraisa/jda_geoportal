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
  const username = config.username;
  const password = config.password;
  const serverInfo = new ServerInfo();
  serverInfo.server = config.portalUrl;
  serverInfo.tokenServiceUrl = config.tokenServiceUrl;


export const authenticate = async () => {
    try {
        esriConfig.apiKey = process.env.NEXT_PUBLIC_ArcGISAPIKey ?? 'API_KEY_NOT_SET';
        const username = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_USERNAME;
        const password = process.env.NEXT_PUBLIC_PORTAL_PUBLISHER_PASSWORD;
        let serverInfo = new ServerInfo();
        serverInfo.server = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'PORTAL_URL_NOT_SET';
        serverInfo.tokenServiceUrl = process.env.NEXT_PUBLIC_PORTAL_TOKEN_SERVICE_URL ?? 'PORTAL_TOKEN_NOT_SET';
        serverInfo.hasServer = true;
        IdentityManager.registerServers([serverInfo]);

        const response = await IdentityManager.generateToken(serverInfo, {
            username: username,
            password: password,
            client: "referer",
            referer: window.location.origin,
        });

        IdentityManager.registerToken({
            server: serverInfo.server,
            token: response.token,
            expires: response.expires,
        });

        return true;
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error; // Reject the promise if authentication fails
    }
};
  