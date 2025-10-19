// components/AdminUI/index.tsx
"use client";

import React from "react";

type ChildrenProp = { children?: React.ReactNode };

/**
 * AdminForm
 * - simple form wrapper. Pass formProps to attach onSubmit, method, action etc.
 * - provides consistent padding/background/font styles for admin pages.
 */
export function AdminForm({
  children,
  className = "",
  formProps,
}: ChildrenProp & { className?: string; formProps?: React.FormHTMLAttributes<HTMLFormElement> }) {
  return (
    <form
      {...(formProps ?? {})}
      className={`w-full max-w-full bg-white rounded-md shadow-sm p-5 text-sm text-gray-800 ${className}`}
    >
      {children}
    </form>
  );
}

/**
 * FormRow
 * - responsive grid row that can host multiple FormField components.
 * - cols default to 2 on desktop, 1 on mobile. You can pass cols={3} for 3 columns.
 */
export function FormRow({
  children,
  cols = 2,
  gap = 12,
  className = "",
}: ChildrenProp & { cols?: number; gap?: number | string; className?: string }) {
  const columnStyle = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: typeof gap === "number" ? `${gap}px` : gap,
  } as React.CSSProperties;

  return (
    <div className={`w-full`} style={columnStyle} className={`grid ${className}`}>
      {children}
    </div>
  );
}

/**
 * FormField
 * - label, optional help text, and container for input/controls (children).
 * - Props:
 *    label: label text
 *    htmlFor: id for the input
 *    help: small help / hint text
 *    required: shows asterisk
 *    className: wrapper class
 */
export function FormField({
  label,
  htmlFor,
  children,
  help,
  required = false,
  className = "",
}: ChildrenProp & { label?: string; htmlFor?: string; help?: string; required?: boolean; className?: string }) {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required ? <span aria-hidden className="text-rose-600">*</span> : null}
        </label>
      )}
      <div className="">{children}</div>
      {help && <div className="mt-1 text-xs text-gray-500">{help}</div>}
    </div>
  );
}

/**
 * FormActions
 * - container for buttons at the form bottom. Aligns to right by default.
 * - Props:
 *    align: "right" | "left" | "center"
 */
export function FormActions({ children, align = "right", className = "" }: ChildrenProp & { align?: "right" | "left" | "center"; className?: string }) {
  const alignClass = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
  return (
    <div className={`mt-4 flex ${alignClass} gap-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * SubmitButton
 * - standardized primary submit button.
 * - disabled state styles handled.
 */
export function SubmitButton({ children = "Save", disabled = false, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button
      type={rest.type ?? "submit"}
      disabled={disabled}
      {...rest}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm shadow-sm ${
        disabled ? "bg-sky-200 text-sky-800 cursor-not-allowed" : "bg-sky-600 text-white hover:bg-sky-700"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * SecondaryButton
 * - light secondary button (for Cancel etc.)
 */
export function SecondaryButton({ children = "Cancel", onClick, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <button
      type={rest.type ?? "button"}
      onClick={onClick}
      {...rest}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm border bg-white ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * SearchBar
 * - a simple reusable search input with an optional button.
 * - onSearch receives the current query.
 * - supports pressing Enter to trigger search.
 */
export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  showButton = true,
  className = "",
  inputName = "q",
}: {
  value?: string;
  onChange?: (v: string) => void;
  onSearch?: (v: string) => void;
  placeholder?: string;
  showButton?: boolean;
  className?: string;
  inputName?: string;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value ?? "");
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <label htmlFor={inputName} className="sr-only">
        Search
      </label>
      <input
        id={inputName}
        name={inputName}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-400"
      />
      {showButton && (
        <button type="submit" className="px-3 py-2 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700">
          Search
        </button>
      )}
    </form>
  );
}

/**
 * Export a default AdminUI object for convenience (so old imports like `import AdminUI from "@/components/AdminUI"` still work).
 */
const AdminUI = {
  AdminForm,
  FormField,
  FormRow,
  FormActions,
  SubmitButton,
  SecondaryButton,
  SearchBar,
};

export default AdminUI;
