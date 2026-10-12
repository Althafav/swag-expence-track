export const INCOME_CATEGORIES = [
  "Advance payment",
  "Milestone payment",
  "Final payment",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Materials · Interlock/Paving",
  "Materials · Grass/Turf",
  "Materials · Cladding stone",
  "Materials · Other",
  "Labor",
  "Equipment rental",
  "Transport/Fuel",
  "Subcontractor",
  "Misc",
] as const;

// Company entries — money for the whole business, not one project (projectId NULL).
export const COMPANY_LABEL = "Company";

export const COMPANY_EXPENSE_CATEGORIES = [
  "Salaries",
  "Office rent",
  "Marketing",
  "Phone & internet",
  "Vehicle & fuel",
  "Software",
  "Accountant / legal fees",
  "Bank charges",
  "Office supplies",
  "Other",
] as const;

export const COMPANY_INCOME_CATEGORIES = ["Bank interest", "Equipment sale", "Other"] as const;
