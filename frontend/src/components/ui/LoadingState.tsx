export default function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="flex items-center gap-3 py-8 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />{label}</div>;
}
