import React, { useEffect, useRef, useState } from "react";
import useStateStore from "../stateStore";
import { useTranslation } from "react-i18next";
import { getCurrentConfig } from "@/lib/auth-config";

const SessionEndModal = () => {
  const { t } = useTranslation();
  const config = getCurrentConfig();
  const {
    sessionModalOpen,
  } = useStateStore((state) => state);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (sessionModalOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set timeout based on configuration
      timeoutRef.current = setTimeout(() => {
        handleSessionExit();
      }, config.SESSION_MODAL_TIMEOUT);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [sessionModalOpen]);

  if (!sessionModalOpen) return null;

  const handleSessionExit = () => {
    // Clear all cookies before redirecting
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'is_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'arcgis_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'arcgis_token_expiry=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Redirect to auth server
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || '/';
    const callbackUrl = encodeURIComponent(window.location.href);
    window.location.href = `${authUrl}?callback=${callbackUrl}`;
  };

  const handleExtend = async () => {
    if (isExtending) return; // Prevent multiple clicks
    
    setIsExtending(true);
    
    try {
      console.log('Attempting to extend session...');
      
      // Make a POST request to refresh the token
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        credentials: 'include',
      });

      console.log('Refresh response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refresh response data:', data);
        
        // Token refreshed successfully, close the modal
        const { setSessionModalOpen } = useStateStore.getState();
        setSessionModalOpen(false);
        
        // Also refresh ArcGIS token if needed
        try {
          const { authenticateArcGIS } = await import('../lib/authenticate-arcgis');
          await authenticateArcGIS();
        } catch (arcgisError) {
          console.error('Failed to refresh ArcGIS token:', arcgisError);
        }
        
        console.log('Session extended successfully');
      } else {
        // Failed to refresh, exit session
        const errorData = await response.text();
        console.error('Failed to refresh token, response not ok:', response.status, errorData);
        handleSessionExit();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      handleSessionExit();
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[30] bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <div className="mb-4 text-lg font-semibold text-gray-800">
          {t("sessionModal.sessionExpiringMsg")}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className={`btn ${isExtending ? 'btn-gray' : 'btn-secondary'} flex-grow`}
            onClick={handleExtend}
            disabled={isExtending}
          >
            {isExtending ? 'Extending...' : t("sessionModal.Extend")}
          </button>
          <button
            className="btn btn-danger flex-grow"
            onClick={handleSessionExit}
            disabled={isExtending}
          >
            {t("sessionModal.Exit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionEndModal;
