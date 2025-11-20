import React from "react";
import { redirect } from "next/navigation";
import { CalciteIcon } from '@esri/calcite-components-react';
import useStateStore from "@/stateStore";

const LogoutButton: React.FC = () => {
  const logout = () => {
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'is_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = "arcgis_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "arcgis_token_expiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Clear auth state including group translations
    const { clearAuth } = useStateStore.getState();
    clearAuth();
    
    const logoutUrl = process.env.NEXT_PUBLIC_AUTH_LOGOUT_URL;
    redirect(`${logoutUrl}?callback=${encodeURIComponent(window.location.origin)}`);
  };

  return (
    <div className="flex items-center ml-2">
      <button
        onClick={logout}
        title="Logout"
        className="text-gray-500 p-2 bg-white bg-opacity-60 border border-white rounded-full hover:bg-red-200 focus:outline-none w-10 h-10 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
      >
                  <CalciteIcon icon={"sign-out"} scale="m" />
      </button>
    </div>
  );
};

export default LogoutButton;
