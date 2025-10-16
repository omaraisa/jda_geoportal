import React from "react";

interface StatusDisplayProps {
  error: string | null;
  progress: string | null;
  t: (key: string) => string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ error, progress, t }) => {
  return (
    <>
      {error && (
        <div className="mb-4 p-3 mt-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {t("widgets.print.nonSupportedLayerError")}
        </div>
      )}

      {progress && (
        <div className="mb-4 p-3 mt-2 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {progress}
        </div>
      )}
    </>
  );
};
