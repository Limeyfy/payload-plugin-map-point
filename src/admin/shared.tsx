import { useTheme } from "@payloadcms/ui";
import React from "react";

export const useUI = () => {
  const { theme } = useTheme();
  const ui =
    theme === "dark"
      ? {
          border: "var(--theme-border-color)",
          bg: "var(--theme-elevation-200)",
          bgAlt: "var(--theme-elevation-150)",
          text: "var(--theme-elevation-900)",
          subtle: "var(--theme-elevation-400)",
          pin: "var(--theme-error-400)",
          pinBorder: "var(--theme-elevation-200)",
          theme,
        }
      : {
          border: "var(--theme-border-color)",
          bg: "var(--theme-elevation-0)",
          bgAlt: "var(--theme-elevation-50)",
          text: "var(--theme-elevation-900)",
          subtle: "var(--theme-elevation-500)",
          pin: "var(--theme-error-400)",
          pinBorder: "var(--theme-elevation-0)",
          theme,
        } as const;
  return ui;
};

export const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}> = ({ value, onChange, onSubmit, placeholder }) => {
  const ui = useUI();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={placeholder || "Search location"}
        style={{
          width: "100%",
        }}
      />
      <button
        type="button"
        onClick={onSubmit}
        style={{
          padding: "8px 12px",
          background: ui.bgAlt,
          color: ui.text,
          border: `1px solid ${ui.border}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </div>
  );
};

export const Footer: React.FC<{
  value: [number, number] | null;
  onClear: () => void;
}> = ({ value, onClear }) => {
  const ui = useUI();
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <small style={{ opacity: 0.9, color: ui.subtle }}>
        {value
          ? `Lng, Lat: ${value[0]?.toFixed(6)}, ${value[1]?.toFixed(6)}`
          : "Click the map to set a point"}
      </small>
      <button
        type="button"
        disabled={!value}
        onClick={onClear}
        style={{
          marginLeft: "auto",
          padding: "6px 10px",
          background: ui.bgAlt,
          color: ui.text,
          border: `1px solid ${ui.border}`,
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Clear
      </button>
    </div>
  );
};

