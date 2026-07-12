import { differenceInDays } from "date-fns";

export type PolicyStatus = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";

export function getPolicyStatus(riskEndDate: Date | string): PolicyStatus {
  const endDate = new Date(riskEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining = differenceInDays(endDate, today);

  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= 30) return "EXPIRING_SOON";
  return "ACTIVE";
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getDaysRemaining(riskEndDate: Date | string): number {
  const endDate = new Date(riskEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(endDate, today);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
