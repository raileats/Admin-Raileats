// components/AdminForm.tsx
"use client";

import React from "react";

type FormFieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  children?: React.ReactNode;
  className?: string;
};

export function FormField({ label, hint, error, children, className = "" }: FormFieldProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}
      <div className={`${error ? "ring-1 ring-red-300 rounded" : ""}`}>{children}</div>
      {hint && !error && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}

export function FormRow({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col sm:flex-row sm:items-center gap-3 ${className}`}>{children}</div>;
}

export function FormActions({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`flex items-center gap-3 justify-end mt-3 ${className}`}>{children}</div>;
}

export function SubmitButton({
  children,
  disabled,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) {
  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm ${
        disabled ? "bg-yellow-200 text-gray-700 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-500 text-black"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** SearchBar: controlled input + button. Parent passes value/onChange/onSearch */
export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
}: {
  value?: string;
  onChange?: (v: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch?.();
          }
        }}
        placeholder={placeholder}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-yellow-300"
      />
      <button
        type="button"
        onClick={() => onSearch?.()}
        className="rounded-lg px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm"
        aria-label="Search"
      >
        Search
      </button>
    </div>
  );
}

export default {
  FormField,
  FormRow,
  FormActions,
  SubmitButton,
  SearchBar,
};
