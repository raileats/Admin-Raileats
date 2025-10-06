components/ui/Toggle.tsx// components/ui/Toggle.tsx
"use client";
import React from "react";

type Props = {
  value: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  ariaLabel?: string;
  small?: boolean;
};

export default function Toggle({ value, onChange, id, disabled = false, ariaLabel = "Toggle", small = false }: Props) {
  const inputId = id ?? "toggle-" + Math.random().toString(36).slice(2);

  return (
    <label
      htmlFor={inputId}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
      }}
      aria-disabled={disabled}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={value}
        onChange={(e) => {
          if (disabled) return;
          onChange(e.target.checked);
        }}
        disabled={disabled}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
        }}
        aria-label={ariaLabel}
      />
      <span
        role="presentation"
        onClick={(e) => {
          if (disabled) return;
          onChange(!value);
          e.stopPropagation();
        }}
        style={{
          width: small ? 42 : 48,
          height: small ? 22 : 26,
          background: value ? "#06b6d4" : "#e6e6e6",
          borderRadius: 999,
          display: "inline-block",
          padding: 3,
          transition: "background 180ms ease",
          boxSizing: "content-box",
        }}
      >
        <span
          style={{
            display: "block",
            width: small ? 16 : 20,
            height: small ? 16 : 20,
            borderRadius: 999,
            background: "#fff",
            transform: `translateX(${value ? (small ? 20 : 22) : 0}px)`,
            transition: "transform 160ms cubic-bezier(.2,.8,.2,1)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </span>
      <span style={{ fontSize: 13, color: "#333" }}>{value ? "ON" : "OFF"}</span>
    </label>
  );
}
