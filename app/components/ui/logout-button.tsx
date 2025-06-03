import React from "react";
import { redirect } from "next/navigation";
import { CalciteIcon } from '@esri/calcite-components-react';

const LogoutButton: React.FC = () => {
  const logout = () => {
    document.cookie = "arcgis_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "arcgis_token_expiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    redirect(process.env.NEXT_PUBLIC_AUTH_LOGOUT_URL || '/');
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
