import { LEAD_STATUSES } from "@/constants";

export const getStatusLabel = (status?: string) => {
  if (!status) {
    return "Open";
  }
  const statusObj = LEAD_STATUSES.find((s) => s.value === status);
  return statusObj?.label || status;
};

export const getStatusVariant = (
  status?: string
): "default" | "secondary" | "outline" => {
  if (!status || status === "open") {
    return "secondary";
  }
  if (status === "booked" || status === "waiting-plus") {
    return "default";
  }
  if (status === "rejected" || status === "does-not-exist") {
    return "outline";
  }
  return "secondary";
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    rejected:
      "!text-red-700 dark:!text-red-400 focus:!text-red-700 dark:focus:!text-red-400 hover:!text-red-700 dark:hover:!text-red-400",
    booked:
      "!text-green-700 dark:!text-green-400 focus:!text-green-700 dark:focus:!text-green-400 hover:!text-green-700 dark:hover:!text-green-400",
    closed:
      "!text-purple-700 dark:!text-purple-400 focus:!text-purple-700 dark:focus:!text-purple-400 hover:!text-purple-700 dark:hover:!text-purple-400",
    voicemail:
      "!text-slate-700 dark:!text-slate-300 focus:!text-slate-700 dark:focus:!text-slate-300 hover:!text-slate-700 dark:hover:!text-slate-300",
    open: "!text-blue-700 dark:!text-blue-400 focus:!text-blue-700 dark:focus:!text-blue-400 hover:!text-blue-700 dark:hover:!text-blue-400",
    waiting:
      "!text-orange-700 dark:!text-orange-400 focus:!text-orange-700 dark:focus:!text-orange-400 hover:!text-orange-700 dark:hover:!text-orange-400",
    "does-not-exist":
      "!text-cyan-700 dark:!text-cyan-400 focus:!text-cyan-700 dark:focus:!text-cyan-400 hover:!text-cyan-700 dark:hover:!text-cyan-400",
    "waiting-plus":
      "!text-emerald-700 dark:!text-emerald-400 focus:!text-emerald-700 dark:focus:!text-emerald-400 hover:!text-emerald-700 dark:hover:!text-emerald-400",
  };
  return (
    colorMap[status] ||
    "!text-muted-foreground focus:!text-muted-foreground hover:!text-muted-foreground"
  );
};

export const getStatusBadgeColor = (status?: string): string => {
  if (!status) {
    status = "open";
  }
  const colorMap: Record<string, string> = {
    rejected:
      "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
    booked:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
    closed:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    voicemail:
      "bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    open: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    waiting:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    "does-not-exist":
      "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    "waiting-plus":
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };
  return colorMap[status] || "bg-secondary text-secondary-foreground";
};
