import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  children: ReactNode;
}

export default function Button({ variant = "primary", size = "md", className, children, ...props }: Props) {
  const variants: Record<Variant, string> = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
    secondary: "bg-indigo-50 text-brand-700 hover:bg-indigo-100",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
