import React from "react";
import { FormField } from "./form-field";
import { PrintFormData } from "./types";
import { FORMATS, JDALAYOUTS, CLASSIFICATION_KEYS, RESOLUTION_OPTIONS } from "./constants";
import Button from '../../ui/button';
import TextInput from '../../ui/text-input';
import SelectDropdown from '../../ui/select-dropdown';
import CheckboxField from '../../ui/checkbox-field';

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
        <TextInput
          id="print-title"
          value={formData.title}
          onChange={(value) => {
            const event = { target: { name: 'title', value } } as React.ChangeEvent<HTMLInputElement>;
            onInputChange(event);
          }}
        />
      </FormField>

      <FormField label={t("widgets.print.Format")}>
        <SelectDropdown
          value={formData.format}
          onChange={(value) => {
            const event = { target: { name: 'format', value } } as React.ChangeEvent<HTMLSelectElement>;
            onInputChange(event);
          }}
          options={FORMATS.map((fmt) => ({ 
            value: fmt, 
            label: fmt.toUpperCase() 
          }))}
        />
      </FormField>

      <FormField label={t("widgets.print.Layout")}>
        <SelectDropdown
          value={formData.layout}
          onChange={(value) => {
            const event = { target: { name: 'layout', value } } as React.ChangeEvent<HTMLSelectElement>;
            onInputChange(event);
          }}
          options={JDALAYOUTS.map((lay) => ({ 
            value: lay, 
            label: lay 
          }))}
        />
      </FormField>

      <FormField label={t("widgets.print.Classification")}>
        <SelectDropdown
          value={formData.classification}
          onChange={(value) => {
            const event = { target: { name: 'classification', value } } as React.ChangeEvent<HTMLSelectElement>;
            onInputChange(event);
          }}
          options={CLASSIFICATION_KEYS.map((key) => ({ 
            value: key, 
            label: t(`widgets.print.classificationLevels.${key}`)
          }))}
        />
      </FormField>

      <FormField label={t("widgets.print.Resolution")}>
        <SelectDropdown
          value={resolution.toString()}
          onChange={(value) => {
            const event = { target: { name: 'resolution', value } } as React.ChangeEvent<HTMLSelectElement>;
            onResolutionChange(event);
          }}
          options={RESOLUTION_OPTIONS.map((option) => ({ 
            value: option.value.toString(), 
            label: t(`widgets.print.${option.label}`)
          }))}
        />
      </FormField>

      <CheckboxField
        checked={formData.includeLegend}
        onChange={(checked: boolean) => {
          const event = { target: { name: 'includeLegend', checked } } as React.ChangeEvent<HTMLInputElement>;
          onCheckboxChange(event);
        }}
        label={t("widgets.print.IncludeLegend")}
        name="includeLegend"
        id="legend_checkbox"
      />

      <CheckboxField
        checked={formData.includeScale}
        onChange={(checked: boolean) => {
          const event = { target: { name: 'includeScale', checked } } as React.ChangeEvent<HTMLInputElement>;
          onCheckboxChange(event);
        }}
        label={t("widgets.print.IncludeScale")}
        name="includeScale"
        id="scale_checkbox"
      />

      <Button
        type="submit"
        disabled={isLoading}
        variant="primary"
        noFlex
      >
        {isLoading ? t("widgets.print.printing") : t("widgets.print.print")}
      </Button>
    </form>
  );
};
