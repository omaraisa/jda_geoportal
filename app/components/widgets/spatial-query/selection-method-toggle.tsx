"use client";

import { useTranslation } from "react-i18next";
import styles from "../spatial-query.module.css";

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
    <label
      className={styles.label}
      style={{
        background: "white",
        border: !selectionMethodChecked ? "2px solid var(--secondary)" : " 2px solid var(--primary-dark-transparent)",
      }}
    >
      <input
        type="checkbox"
        className={styles.input}
        checked={selectionMethodChecked}
        onChange={onToggle}
      />
      <span
        className={styles.circle}
        style={{
          backgroundColor: !selectionMethodChecked ? "var(--secondary)" : "var(--primary-dark-transparent)",
          right: selectionMethodChecked ? "calc(100% - 45px)" : "5px",
        }}
      ></span>
      <p
        className={`${styles.title} ${!selectionMethodChecked ? styles.visible : styles.hidden}`}
        style={{
          color: "var(--secondary-dark)",
        }}
      >
        {t("widgets.query.byLayer")}
      </p>
      <p
        className={`${styles.title} ${selectionMethodChecked ? styles.visible : styles.hidden}`}
        style={{
          color: "var(--secondary-dark)",
        }}
      >
        {t("widgets.query.byDrawing")}
      </p>
    </label>
  );
}
