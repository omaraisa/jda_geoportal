"use client";

import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";

interface AnalysisControlsProps {
  onRun: () => void;
  status: string;
  statusType: "info" | "success" | "error" | "";
}

export default function AnalysisControls({
  onRun,
  status,
  statusType
}: AnalysisControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          variant="primary"
          onClick={onRun}
          className="w-full"
        >
          {t("widgets.changeDetection.run") || "Run Analysis"}
        </Button>
      </div>

      {status && (
        <div className={`mb-4 p-3 mt-2 ${
          statusType === "success"
            ? "bg-[rgba(122,181,122,0.7)] border-green-400 text-[rgb(67, 90, 67)]"
            : statusType === "error"
              ? "bg-red-100 border-red-400 text-red-700"
              : "bg-blue-100 border-blue-400 text-blue-700"
          } border rounded`}>
          {status}
        </div>
      )}
    </div>
  );
}
