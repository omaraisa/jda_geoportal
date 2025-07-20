export const JDALAYOUTS = ["Standard", "Presentation"];
export const CLASSIFICATION_KEYS = ["Restricted", "Confidential", "Internal"];
export const FORMATS = ["pdf", "png8", "jpg"] as const;
export const SCALEBAR_UNITS = ["metric", "imperial"] as const;

export const RESOLUTION_OPTIONS = [
  { value: 300, label: "Default" },
  { value: 600, label: "High" }
];

export const DEFAULT_FORM_DATA = {
  title: "My Map",
  format: "pdf" as const,
  layout: "Standard",
  includeLegend: true,
  includeScale: true,
  scalebarUnit: "metric" as const,
  classification: "Restricted" as const,
};

export const POLLING_CONFIG = {
  maxAttempts: 60,
  intervalMs: 2000,
};
