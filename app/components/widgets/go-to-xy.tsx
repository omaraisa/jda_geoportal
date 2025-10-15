import { useState } from "react";
import useStateStore from "@/stateStore";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import NumberInput from "@/components/widgets/analysis-tools/number-input";
import { useTranslation } from "react-i18next";
import { CalciteIcon } from "@esri/calcite-components-react";

export default function GoToXYComponent() {
  const { t } = useTranslation();
  const view = useStateStore((state) => state.targetView);
  const { updateStats } = useStateStore();

  const [longitude, setLongitude] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [zoom, setZoom] = useState(10);

  const handleGoToLocation = () => {
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      useStateStore.getState().sendMessage({
        title: t('systemMessages.error.genericError.title'),
        body: t('widgets.goToXY.invalidCoordinates'),
        type: 'error'
      });
      return;
    }

    if (view) {
      view.goTo({
        center: [longitude, latitude],
        zoom: zoom,
      });
      updateStats("GoToXY");
    }
  };

  const handleClear = () => {
    setLongitude(0);
    setLatitude(0);
    setZoom(10);
  };

  return (
    <div className="flex-column-container">
      <div className="p-4 flex flex-col gap-4 w-full">
        <h2 className="block text-foreground font-semibold">
          {t('widgets.goToXY.title')}
        </h2>

        <NumberInput
          label={t('widgets.goToXY.longitude')}
          value={longitude}
          onChange={setLongitude}
          min={-180}
          max={180}
          step={0.000001}
          placeholder="39.19"
        />

        <NumberInput
          label={t('widgets.goToXY.latitude')}
          value={latitude}
          onChange={setLatitude}
          min={-90}
          max={90}
          step={0.000001}
          placeholder="21.60"
        />

        <NumberInput
          label={t('widgets.goToXY.zoom')}
          value={zoom}
          onChange={setZoom}
          min={1}
          max={24}
          step={1}
          placeholder="10"
        />

        <div className="flex flex-col gap-4">
          <Button
            variant="primary"
            onClick={handleGoToLocation}
            className="w-full"
          >
            <span className="flex items-center justify-center">
              <CalciteIcon icon="cursor-click" scale="m" />
              <span className="ml-2">{t('widgets.goToXY.goToLocation')}</span>
            </span>
          </Button>

          <Button
            variant="gray"
            onClick={handleClear}
            className="w-full"
          >
            <span className="flex items-center justify-center">
              <CalciteIcon icon="x-circle-f" scale="m" />
              <span className="ml-2">{t('widgets.goToXY.clear')}</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}