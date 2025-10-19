"use client";

import React from "react";

// Lightweight Admin UI primitives used across the admin app.
// - FormField: label + input wrapper
// - SubmitButton: consistent CTA
// - SearchBar: compact search input + button
// - Toggle: small checkbox toggle
// - Select: styled select
// Export a default object for easy import: `import UI from '@/components/AdminUI'`

type FormFieldProps = React.ComponentPropsWithoutRef<"input"> & {
  label?: string;
  hint?: string;
  error?: string | null;
  children?: React.ReactNode; // allow select/textarea inside
  className?: string;
};

export function FormField({ label, hint, error, children, className = "", ...rest }: FormFieldProps) {
  // if children provided, render them (for selects/textarea), else render input
  const showError = !!error;
  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}

      {children ? (
        <div className={`w-full ${showError ? "ring-1 ring-red-300" : ""}`}>{children}</div>
      ) : (
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 ${
            showError ? "border-red-400" : "border-gray-200"
          }`}
          {...(rest as any)}
        />
      )}

      {hint && !showError && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
      {showError && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}

FormField.displayName = "AdminFormField";

export function SubmitButton({ children, className = "", disabled, onClick, type = "button" }: any) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm ${
        disabled
          ? "bg-yellow-200 text-gray-700 cursor-not-allowed"
          : "bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer"
      } ${className}`}
    >
      {children}
    </button>
  );
}

SubmitButton.displayName = "AdminSubmitButton";

export function SearchBar({ value, onChange, onSearch, placeholder = "Search...", className = "" }: any) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-yellow-300"
      />
      <button
        onClick={onSearch}
        className="rounded-lg px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm"
        aria-label="Search"
      >
        Search
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }: any) {
  const inputId = id ?? `toggle_${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={inputId} className="inline-flex items-center cursor-pointer select-none">
        <input id={inputId} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
        <span
          aria-hidden
          className={`inline-block w-11 h-6 rounded-full transition-colors ${checked ? "bg-yellow-400" : "bg-gray-300"}`}
        >
          <span
            className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
            style={{ margin: 2 }}
          />
        </span>
      </label>
      {label && <div className="text-sm text-gray-700">{label}</div>}
    </div>
  );
}

export function Select({ children, className = "", ...rest }: any) {
  return (
    <select className={`w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-300 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function IconInput({ icon, ...props }: any) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ fontSize: 18 }}>{icon}</div>
      <input className="w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-300" {...props} />
    </div>
  );
}

// AdminForm wrapper provides consistent spacing for forms
export function AdminForm({ children, onSubmit, className = "" }: any) {
  return (
    <form onSubmit={onSubmit} className={`flex flex-col gap-3 ${className}`}>
      {children}
    </form>
  );
}

const UI = {
  FormField,
  SubmitButton,
  SearchBar,
  Toggle,
  Select,
  IconInput,
  AdminForm,
};

export default UI;
