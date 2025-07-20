"use client";

import { useTranslation } from "react-i18next";

interface QueryActionsProps {
  selectionMethodChecked: boolean;
  onRunQueryByLayer: () => void;
  onClearSelection: () => void;
}

export default function QueryActions({
  selectionMethodChecked,
  onRunQueryByLayer,
  onClearSelection
}: QueryActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-4">
      {!selectionMethodChecked && (
        <button className="btn btn-primary w-full" onClick={onRunQueryByLayer}>
          {t("widgets.query.search")}
        </button>
      )}
      
      <button
        className="btn btn-danger w-full"
        onClick={onClearSelection}
      >
        {t("widgets.query.clearSearch")}
      </button>
    </div>
  );
}
