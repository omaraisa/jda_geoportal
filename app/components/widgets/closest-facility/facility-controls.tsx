import { useTranslation } from 'react-i18next';
import SelectDropdown from '../../ui/select-dropdown';

interface FacilityControlsProps {
  targetLayerId: string;
  numFacilities: number;
  layers: any[];
  onLayerChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNumFacilitiesChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function FacilityControls({
  targetLayerId,
  numFacilities,
  layers,
  onLayerChange,
  onNumFacilitiesChange
}: FacilityControlsProps) {
  const { t } = useTranslation();

  const handleLayerChange = (value: string) => {
    const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
    onLayerChange(event);
  };

  const handleNumFacilitiesChange = (value: string) => {
    const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
    onNumFacilitiesChange(event);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.targetLayer")}
        </label>
        <div className="select">
          <SelectDropdown
            value={targetLayerId}
            onChange={handleLayerChange}
            options={[
              { value: "", label: t("widgets.closestFacility.selectLayer") },
              ...layers.map((layer: any) => ({ 
                value: layer.id, 
                label: layer.title || layer.name || layer.id 
              }))
            ]}
          />
        </div>
      </div>

      <div>
        <label className="font-semibold mb-1 block">
          {t("widgets.closestFacility.numFacilities")}
        </label>
        <div className="select">
          <SelectDropdown
            value={numFacilities.toString()}
            onChange={handleNumFacilitiesChange}
            options={[1, 2, 3, 4, 5].map((n) => ({ 
              value: n.toString(), 
              label: n.toString() 
            }))}
          />
        </div>
      </div>
    </div>
  );
}
