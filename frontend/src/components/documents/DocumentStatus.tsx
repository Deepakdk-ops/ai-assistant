import Badge from "../ui/Badge";
import type { DocumentStatus as Status } from "../../types/document";

export default function DocumentStatus({ status }: { status: Status }) {
  const map = {
    queued: { tone: "slate" as const, label: "Queued" },
    processing: { tone: "amber" as const, label: "Processing" },
    processed: { tone: "green" as const, label: "Processed" },
    failed: { tone: "red" as const, label: "Failed" },
  };
  const value = map[status] ?? map.queued;
  return <Badge tone={value.tone}>{value.label}</Badge>;
}
