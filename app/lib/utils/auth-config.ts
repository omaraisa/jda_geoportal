
export const AUTH_CONFIG = {
  // Development/Testing configuration (1-minute tokens)
  TESTING: {
    // Token check interval (check every 10 seconds for 1-min tokens)
    CHECK_INTERVAL: 10000, // 10 seconds
    
    // Session modal buffer (show modal when token expires in 30 seconds)
    SESSION_MODAL_BUFFER: 30, // 30 seconds
    
    // Session modal timeout (auto-logout after 30 seconds)
    SESSION_MODAL_TIMEOUT: 30000, // 30 seconds
    
    GIS_TOKEN_DURATION_MINUTES: 2,

    TOKEN_DURATION_MINUTES: 1,
  },
  
  // Production configuration (15-minute tokens)
  PRODUCTION: {
    // Token check interval (check every minute for 15-min tokens)
    CHECK_INTERVAL: 60000, // 1 minute
    
    // Session modal buffer (show modal when token expires in 2 minutes)
    SESSION_MODAL_BUFFER: 120, // 2 minutes
    
    // Session modal timeout (auto-logout after 2 minutes)
    SESSION_MODAL_TIMEOUT: 120000, // 2 minutes
    
    GIS_TOKEN_DURATION_MINUTES: 60,

      // Token duration for server-side configuration reference
    TOKEN_DURATION_MINUTES: 15,
  }
};

export const CURRENT_ENV = 'PRODUCTION';

export const getCurrentConfig = () => {
  return AUTH_CONFIG[CURRENT_ENV];
};

export const formatTime = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};
