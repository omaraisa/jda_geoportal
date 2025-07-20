"use client";

import { useTranslation } from "react-i18next";
import { AttributeQueryState } from "@/interface";

interface QueryActionsProps {
  state: AttributeQueryState;
  onSearch: () => void;
  onClearSearch: () => void;
  onCreateLayer: () => void;
}

export default function QueryActions({
  state,
  onSearch,
  onClearSearch,
  onCreateLayer
}: QueryActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex gap-2 w-full">
        <button
          className={`btn ${state.inputMethod === "manual" ? 'btn-primary' : 'btn-gray'} flex-grow`}
          onClick={onSearch}
          disabled={state.inputMethod !== "manual"}
        >
          {t("widgets.query.search")}
        </button>
        <button
          className="btn btn-secondary flex-grow"
          onClick={onClearSearch}
        >
          {t("widgets.query.clearSearch")}
        </button>
      </div>

      <div className="flex gap-2 w-full">
        <button
          className={`btn ${state.downloadBtnDisabled ? 'btn-gray' : 'btn-primary'} flex-grow`}
          disabled={state.downloadBtnDisabled}
          onClick={onCreateLayer}
        >
          {t("widgets.query.createNewLayer")}
        </button>
      </div>
    </div>
  );
}
