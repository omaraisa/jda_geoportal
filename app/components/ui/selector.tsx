import React from "react";

interface LayerSelectorProps {
  label: string;
  options: { value: string; label: string }[];
  getSelectedValue: (value: string) => void;
}

const LayerSelector: React.FC<LayerSelectorProps> = ({ label,options, getSelectedValue }) => {
  const layerSelector = React.useRef<HTMLSelectElement>(null);

  return (
    <div className="flex flex-col w-full">
      <label  className="font-semibold text-white"> {label}</label>
      <div className="select">
        <select
          defaultValue=""
          ref={layerSelector}
          id="layerSelector"
          onChange={(e) => getSelectedValue(e.target.value)}
        >
          <option value="" hidden>
          </option>
            {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
            ))}
        </select>
      </div>
    </div>
  );
};

export default LayerSelector;
