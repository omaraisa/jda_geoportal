"use client";

import { useTranslation } from "react-i18next";

interface QueryActionsProps {
  selectionMethodChecked: boolean;
  onRunQueryByLayer: () => void;
  onClearSelection: () => void;
  onSwitchSelection: () => void;
  onCreateLayer: () => void;
  hasResults: boolean;
}

export default function QueryActions({
  selectionMethodChecked,
  onRunQueryByLayer,
  onClearSelection,
  onSwitchSelection,
  onCreateLayer,
  hasResults
}: QueryActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-4">
      {!selectionMethodChecked && (
        <button className="btn btn-primary w-full" onClick={onRunQueryByLayer}>
          {t("widgets.query.search")}
        </button>
      )}
      
      <div className="flex gap-2">
        <button
          className="btn btn-secondary flex-grow"
          onClick={onSwitchSelection}
        >
          {t("widgets.query.switchSelection")}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          className="btn btn-danger flex-grow"
          onClick={onClearSelection}
        >
          {t("widgets.query.clearSearch")}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          className={`btn ${!hasResults ? 'btn-gray' : 'btn-primary'} flex-grow`}
          disabled={!hasResults}
          onClick={onCreateLayer}
        >
          {t("widgets.query.createNewLayer")}
        </button>
      </div>
    </div>
  );
}
