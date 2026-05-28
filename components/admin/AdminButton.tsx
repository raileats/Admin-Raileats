import React from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
  secondary: "bg-white text-slate-800 hover:bg-slate-50 border-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
};

export default function AdminButton({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
