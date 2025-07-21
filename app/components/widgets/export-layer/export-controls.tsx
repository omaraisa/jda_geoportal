import Button from '../../ui/button';
import TextInput from '../../ui/text-input';
import SelectDropdown from '../../ui/select-dropdown';

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
      <TextInput
        id="layerTitle"
        value={outputName}
        onChange={(value) => setOutputName(value)}
        placeholder={t("widgets.exportLayer.titlePlaceholder")}
      />

      <div className="flex flex-col w-full">
        <label htmlFor="formatSelect" className="font-semibold text-foreground">
          {t("widgets.exportLayer.selectFormat")}
        </label>
        <SelectDropdown
          value={exportFormat}
          onChange={setExportFormat}
          options={[
            { value: "csv", label: t("widgets.exportLayer.csv") },
            { value: "shapefile", label: t("widgets.exportLayer.shapefile") },
            { value: "kml", label: t("widgets.exportLayer.kml") },
            { value: "geojson", label: t("widgets.exportLayer.geojson") }
          ]}
        />
      </div>

      <div className="flex space-x-2">
        <Button
          variant={isExporting ? "secondary" : "primary"}
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting
            ? t("widgets.exportLayer.exporting")
            : t("widgets.exportLayer.export")}
        </Button>
        {/* Uncomment if stop functionality is needed
        {isExporting && (
          <Button
            variant="danger"
            onClick={onStop}
          >
            {t("widgets.exportLayer.stop") || "Stop"}
          </Button>
        )} */}
      </div>
    </>
  );
}
