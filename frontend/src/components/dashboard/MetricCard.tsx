import type { LucideIcon } from "lucide-react";
import Card from "../ui/Card";

export default function MetricCard({ title, value, note, icon: Icon, tint }: { title: string; value: string | number; note: string; icon: LucideIcon; tint: "indigo" | "teal" | "violet" | "amber" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700",
    teal: "bg-teal-50 text-teal-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p></div>
        <div className={`rounded-xl p-3 ${colors[tint]}`}><Icon size={20} /></div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </Card>
  );
}
