"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import SelectDropdown from "../../ui/select-dropdown";

interface RelationshipSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const RelationshipSelector: React.FC<RelationshipSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const relationships = [
    { value: "intersects", label: t("widgets.spatialQuery.relationships.intersects") || "Intersects" },
    { value: "contains", label: t("widgets.spatialQuery.relationships.contains") || "Contains" },
    { value: "within", label: t("widgets.spatialQuery.relationships.within") || "Within" },
    { value: "touches", label: t("widgets.spatialQuery.relationships.touches") || "Touches" },
    { value: "overlaps", label: t("widgets.spatialQuery.relationships.overlaps") || "Overlaps" },
  ];

  return (
    <div className="flex flex-col space-y-2">
      <label className="font-semibold text-foreground">
        {t("widgets.spatialQuery.relationship") || "Spatial Relationship"}
      </label>
      <SelectDropdown
        options={relationships}
        value={value}
        onChange={onChange}
        placeholder={t("widgets.spatialQuery.relationship") || "Select Relationship"}
      />
      <span className="text-sm text-muted-foreground italic px-1">
        {t(`widgets.spatialQuery.descriptions.${value}`)}
      </span>
    </div>
  );
};

export default RelationshipSelector;