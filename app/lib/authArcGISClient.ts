'use client';

export const authenticateArcGISClientOnly = async () => {
  const [{ default: esriConfig }, { default: IdentityManager }, { default: ServerInfo }] = await Promise.all([
    import('@arcgis/core/config'),
    import('@arcgis/core/identity/IdentityManager'),
    import('@arcgis/core/identity/ServerInfo'),
  ]);

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

  const getCookie = (name: string): string | undefined => {
    const cookies = Object.fromEntries(
      document.cookie.split('; ').map(c => c.split('='))
    );
    return cookies[name];
  };

  const token = getCookie('arcgis_token');
  const expires = getCookie('arcgis_token_expiry');
  const expiryTime = expires ? parseInt(expires) : Date.now() + 2 * 60 * 60 * 1000;

  if (token) {
    IdentityManager.registerToken({
      server: config.portalUrl,
      token,
      expires: expiryTime,
    });
  }
};
