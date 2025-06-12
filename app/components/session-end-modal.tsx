import React, { useEffect } from "react";
import useStateStore from "../stateStore";
import { useTranslation } from "react-i18next";
import { redirect } from 'next/navigation';

const SessionEndModal = () => {
  const { t } = useTranslation();
  const {
    sessionModalOpen,
    handleSessionExtend,
  } = useStateStore((state) => state);

  useEffect(() => {
    if (sessionModalOpen) {
      const timer = setTimeout(() => {
        handleSessionExit();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [sessionModalOpen]);

  if (!sessionModalOpen) return null;

  interface HandleSessionExit {
    (): void;
  }

  const handleSessionExit: HandleSessionExit = () => {
    redirect(process.env.NEXT_PUBLIC_AUTH_URL || '/');
  };

  return (
    <div className="fixed inset-0 z-[30] bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <div className="mb-4 text-lg font-semibold text-gray-800">
          {t("sessionModal.sessionExpiringMsg")}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button
            className="btn btn-secondary flex-grow"
            onClick={handleSessionExtend}
          >
            {t("sessionModal.Extend")}
          </button>
          <button
            className="btn btn-danger flex-grow"
            onClick={handleSessionExit}
          >
            {t("sessionModal.Exit")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionEndModal;
