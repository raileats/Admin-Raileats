import React from "react";

type FieldProps = {
  label?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
};

export function AdminField({ label, error, children, className = "" }: FieldProps) {
  const childWithLabel =
    label && React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          "data-field-label": label,
        })
      : children;

  return (
    <label className={`block ${className}`}>
      {label ? <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span> : null}
      {childWithLabel}
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function inputIdentity(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return [
    props.name,
    props.id,
    props.placeholder,
    props["data-field-label" as keyof React.InputHTMLAttributes<HTMLInputElement>],
    props["aria-label" as keyof React.InputHTMLAttributes<HTMLInputElement>],
    props.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isEmailInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const identity = inputIdentity(props);
  return props.type === "email" || /\bemail\b/.test(identity);
}

function isPhoneInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const identity = inputIdentity(props);
  return /(phone|mobile|whatsapp|whats\s*app|contact\s*number|contactno|contact_no)/i.test(identity);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isValidPhone(value: string) {
  return /^\d{10}$/.test(value.trim());
}

function validationClasses(kind: "email" | "phone" | null, value: string, readOnly?: boolean) {
  if (!kind || readOnly || !value) return "border-slate-300 focus:border-blue-500 focus:ring-blue-100";
  const valid = kind === "email" ? isValidEmail(value) : isValidPhone(value);
  return valid
    ? "border-emerald-500 focus:border-emerald-600 focus:ring-emerald-100"
    : "border-red-500 focus:border-red-600 focus:ring-red-100";
}

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const kind = isEmailInput(props) ? "email" : isPhoneInput(props) ? "phone" : null;
  const value = String(props.value ?? props.defaultValue ?? "");
  const inputType = kind === "phone" ? "tel" : kind === "email" ? "email" : props.type;

  function phoneDigits(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (kind === "phone") {
      event.currentTarget.value = phoneDigits(event.currentTarget.value);
    }
    props.onChange?.(event);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || kind !== "phone") return;

    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Tab",
      "Enter",
      "Escape",
    ];

    if (event.ctrlKey || event.metaKey || event.altKey || allowedKeys.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const input = event.currentTarget;
    const selectedLength = Math.max(0, (input.selectionEnd ?? 0) - (input.selectionStart ?? 0));
    const currentDigits = input.value.replace(/\D/g, "").length;
    if (currentDigits - selectedLength >= 10) event.preventDefault();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    props.onPaste?.(event);
    if (event.defaultPrevented || kind !== "phone") return;

    event.preventDefault();
    const input = event.currentTarget;
    const pasteDigits = phoneDigits(event.clipboardData.getData("text"));
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next = phoneDigits(input.value.slice(0, start) + pasteDigits + input.value.slice(end));
    input.value = next;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeInputValueSetter?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function handleInput(event: React.FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const nextValue = kind === "phone" ? input.value.replace(/\D/g, "").slice(0, 10) : input.value;
    if (kind === "phone") input.value = nextValue;

    if (!kind || !nextValue) {
      input.setCustomValidity("");
    } else if (kind === "email" && !isValidEmail(nextValue)) {
      input.setCustomValidity("Please enter a valid email address.");
    } else if (kind === "phone" && !isValidPhone(nextValue)) {
      input.setCustomValidity("Please enter exactly 10 digits.");
    } else {
      input.setCustomValidity("");
    }

    props.onInput?.(event);
  }

  return (
    <input
      {...props}
      type={inputType}
      inputMode={kind === "phone" ? "numeric" : props.inputMode}
      maxLength={kind === "phone" ? 10 : props.maxLength}
      pattern={kind === "phone" ? "\\d{10}" : props.pattern}
      title={kind === "phone" ? "Please enter exactly 10 digits." : kind === "email" ? "Please enter a valid email address." : props.title}
      data-admin-validation={kind ?? undefined}
      onChange={handleChange}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${validationClasses(kind, value, props.readOnly)} ${props.className ?? ""}`}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}
