import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export default function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "purple" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    purple: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-transparent", tones[tone])}>{children}</span>;
}
