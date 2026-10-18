import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export default function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-soft", className)} {...props}>{children}</div>;
}
