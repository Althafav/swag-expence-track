export const STATUS_LABEL: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  on_hold: "On hold",
};

// Kept as a plain string here (not imported from ui/Badge, built in a later
// step) so this file has no forward dependency; Badge's own BadgeTone type
// is a superset of these three values.
export const STATUS_TONE: Record<string, "brand" | "success" | "warning"> = {
  ongoing: "brand",
  completed: "success",
  on_hold: "warning",
};

export const STATUS_OPTIONS = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
] as const;
