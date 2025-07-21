"use client";

import { useTranslation } from "react-i18next";
import DualLabelToggle from "../../ui/dual-label-toggle";

interface SelectionMethodToggleProps {
  selectionMethodChecked: boolean;
  onToggle: () => void;
}

export default function SelectionMethodToggle({
  selectionMethodChecked,
  onToggle
}: SelectionMethodToggleProps) {
  const { t } = useTranslation();

  return (
    <DualLabelToggle
      id="spatial-query-toggle"
      leftLabel={t("widgets.query.byLayer")}
      rightLabel={t("widgets.query.byDrawing")}
      checked={selectionMethodChecked}
      onChange={onToggle}
    />
  );
}
