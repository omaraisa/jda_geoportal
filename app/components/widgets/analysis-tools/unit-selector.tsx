import React from "react";
import { useTranslation } from "react-i18next";
import SelectDropdown from '../../ui/select-dropdown';

interface UnitSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  units: Array<{ value: string; label: string }>;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({
  label,
  value,
  onChange,
  units
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <SelectDropdown
        value={value}
        onChange={onChange}
        options={units}
      />
    </div>
  );
};

export default UnitSelector;