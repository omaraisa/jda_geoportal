import React from "react";
import { FormField } from "./form-field";
import { PrintFormData } from "./types";
import { FORMATS, JDALAYOUTS, CLASSIFICATION_KEYS, RESOLUTION_OPTIONS } from "./constants";

interface PrintFormProps {
  formData: PrintFormData;
  resolution: number;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResolutionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  t: (key: string) => string;
}

export const PrintForm: React.FC<PrintFormProps> = ({
  formData,
  resolution,
  isLoading,
  onInputChange,
  onCheckboxChange,
  onResolutionChange,
  onSubmit,
  t
}) => {
  return (
    <form onSubmit={onSubmit}>
      <FormField label={t("widgets.print.title")}>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          className="w-full p-2 border rounded"
        />
      </FormField>

      <FormField label={t("widgets.print.Format")}>
        <select
          name="format"
          value={formData.format}
          onChange={onInputChange}
          className="w-full p-2 border rounded"
        >
          {FORMATS.map((fmt) => (
            <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
          ))}
        </select>
      </FormField>

      <FormField label={t("widgets.print.Layout")}>
        <select
          name="layout"
          value={formData.layout}
          onChange={onInputChange}
          className="w-full p-2 border rounded"
        >
          {JDALAYOUTS.map((lay) => (
            <option key={lay} value={lay}>{lay}</option>
          ))}
        </select>
      </FormField>

      <FormField label={t("widgets.print.Classification")}>
        <select
          name="classification"
          value={formData.classification}
          onChange={onInputChange}
          className="w-full p-2 border rounded"
        >
          {CLASSIFICATION_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`widgets.print.classificationLevels.${key}`)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label={t("widgets.print.Resolution")}>
        <select
          name="resolution"
          value={resolution}
          className="w-full p-2 border rounded"
          onChange={onResolutionChange}
        >
          {RESOLUTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`widgets.print.${option.label}`)}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="checkbox mr-2 rtl:ml-2 rtl:mr-0"
          id="legend_checkbox"
          checked={formData.includeLegend}
          onChange={onCheckboxChange}
          name="includeLegend"
        />
        <label className="tick-label" htmlFor="legend_checkbox">
          <div id="tick_mark"></div>
        </label>
        <span className="ml-2 rtl:mr-2 rtl:ml-0">{t("widgets.print.IncludeLegend")}</span>
      </div>

      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          className="checkbox mr-2 rtl:ml-2 rtl:mr-0"
          id="scale_checkbox"
          checked={formData.includeScale}
          onChange={onCheckboxChange}
          name="includeScale"
        />
        <label className="tick-label" htmlFor="scale_checkbox">
          <div id="tick_mark"></div>
        </label>
        <span className="ml-2 rtl:mr-2 rtl:ml-0">{t("widgets.print.IncludeScale")}</span>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary flex-grow flex justify-stretch w-full"
      >
        {isLoading ? t("widgets.print.printing") : t("widgets.print.print")}
      </button>
    </form>
  );
};
