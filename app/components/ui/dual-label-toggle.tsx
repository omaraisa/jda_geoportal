import React from 'react';

interface DualLabelToggleProps {
  id: string;
  leftLabel: string;
  rightLabel: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export default function DualLabelToggle({ 
  id, 
  leftLabel,
  rightLabel,
  checked = false, 
  onChange,
  className = ''
}: DualLabelToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      className={`dual-toggle-label ${className}`}
      style={{
        background: !checked ? "#e2c3df8a" : "#c3d7e28a",
        border: !checked ? "2px solid var(--secondary)" : "2px solid var(--secondary-transparent)",
        display: "flex",
        alignItems: "center",
        textAlign: "center",
        borderRadius: "50px",
        height: "50px",
        cursor: "pointer",
        transition: "all 0.4s ease",
        padding: "5px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <span
        className="dual-toggle-circle"
        style={{
          height: "40px",
          width: "40px",
          borderRadius: "50%",
          backgroundColor: !checked ? "var(--primary)" : "var(--primary-transparent)",
          right: checked ? "calc(100% - 45px)" : "5px",
          transition: "all 0.4s ease",
          position: "absolute",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}
      />
      <p
        className="dual-toggle-label-text"
        style={{
          alignItems: "center",
          textAlign: "center",
          fontSize: "1rem",
          color: !checked ? "#333" : "#999",
          fontWeight: !checked ? "600" : "400",
          transition: "all 0.4s ease",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          opacity: !checked ? 1 : 0,
          visibility: !checked ? "visible" : "hidden"
        }}
        >
        {leftLabel}
      </p>
      <p
        className="dual-toggle-label-text"
        style={{
            alignItems: "center",
            textAlign: "center",
            fontSize: "1rem",
            color: checked ? "var(--foreground)" : "#999",
          fontWeight: checked ? "600" : "400",
          transition: "all 0.4s ease",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          opacity: checked ? 1 : 0,
          visibility: checked ? "visible" : "hidden"
        }}
      >
        {rightLabel}
      </p>
    </label>
  );
}
