import React from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className }: Props) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
