interface ExportControlsProps {
  exportFormat: string;
  setExportFormat: (format: string) => void;
  outputName: string;
  setOutputName: (name: string) => void;
  isExporting: boolean;
  onExport: () => void;
  onStop: () => void;
  t: any;
}

export function ExportControls({
  exportFormat,
  setExportFormat,
  outputName,
  setOutputName,
  isExporting,
  onExport,
  onStop,
  t,
}: ExportControlsProps) {
  return (
    <>
      <label htmlFor="layerTitle" className="font-semibold text-foreground">
        {t("widgets.exportLayer.enterTitle")}
        <span className="text-xs text-muted ml-2 mr-2">
          ({t("widgets.exportLayer.optional")})
        </span>
      </label>
      <label htmlFor="layerTitle" className="textInput">
        <input
          id="layerTitle"
          type="text"
          className="input-text"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          placeholder=" "
        />
        <span className="label">{t("widgets.exportLayer.titlePlaceholder")}</span>
      </label>

      <div className="flex flex-col w-full">
        <label htmlFor="formatSelect" className="font-semibold text-foreground">
          {t("widgets.exportLayer.selectFormat")}
        </label>
        <div className="select">
          <select
            id="formatSelect"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="input-select"
          >
            <option value="csv">{t("widgets.exportLayer.csv")}</option>
            <option value="shapefile">{t("widgets.exportLayer.shapefile")}</option>
            <option value="kml">{t("widgets.exportLayer.kml")}</option>
            <option value="geojson">{t("widgets.exportLayer.geojson")}</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          className={`btn ${isExporting ? "btn-gray" : "btn-primary"} w-full`}
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting
            ? t("widgets.exportLayer.exporting")
            : t("widgets.exportLayer.export")}
        </button>
        {/* Uncomment if stop functionality is needed
        {isExporting && (
          <button
            className="btn btn-danger w-full"
            onClick={onStop}
            type="button"
          >
            {t("widgets.exportLayer.stop") || "Stop"}
          </button>
        )} */}
      </div>
    </>
  );
}
