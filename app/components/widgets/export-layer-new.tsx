"use client";

import { useTranslation } from "react-i18next";
import useStateStore from "@/stateStore";
import LayerSelector from "./layer-list/layer-selector";
import { useExportLayer } from "./export-layer/use-export-layer";
import { ExportControls } from "./export-layer/export-controls";
import { StatusDisplay } from "./export-layer/status-display";

export default function ExportLayer() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const sendMessage = useStateStore((state) => state.sendMessage);
  const updateStats = useStateStore((state) => state.updateStats);

  const {
    exportFormat,
    setExportFormat,
    outputName,
    setOutputName,
    isExporting,
    status,
    statusType,
    handleSelectedLayer,
    handleExport,
    handleStop,
  } = useExportLayer(view, sendMessage, updateStats, t);

  return (
    <div className="flex flex-col space-y-4 p-4">
      <LayerSelector getSelectedValue={handleSelectedLayer} />

      <ExportControls
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        outputName={outputName}
        setOutputName={setOutputName}
        isExporting={isExporting}
        onExport={handleExport}
        onStop={handleStop}
        t={t}
      />

      <StatusDisplay status={status} statusType={statusType} />
    </div>
  );
}
