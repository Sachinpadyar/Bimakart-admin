import type { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <div className="relative inline-flex group">
      {children}

      <span
        className="
          pointer-events-none
          absolute -top-9 left-1/2 -translate-x-1/2
          whitespace-nowrap
          rounded bg-gray-900 px-2 py-1 text-xs text-white
          opacity-0 group-hover:opacity-100
          transition
        "
      >
        {label}
      </span>
    </div>
  );
}
