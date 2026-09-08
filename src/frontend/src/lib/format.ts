import type { AgentStatus } from "@/types";

/**
 * Convert a Motoko nanosecond timestamp (bigint) to a JavaScript Date.
 * Returns null when the value cannot be represented as a valid date.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a money-supply value as a compact currency string. */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

/** Format a knowledge-level value with a compact suffix (k / M). */
export function formatKnowledge(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

/** Format a plain integer with thousands separators. */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

/** Human-readable label for an agent lifecycle state. */
export function statusLabel(status: AgentStatus): string {
  switch (status) {
    case "alive":
      return "Alive";
    case "evolving":
      return "Evolving";
    case "dormant":
      return "Dormant";
    case "extinct":
      return "Extinct";
  }
}

/** Format a backend timestamp as a short human-readable date. */
export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Format a token amount with up to 4 significant decimals. */
export function formatTokenAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 4,
  }).format(value);
}

/** Format a trade price as a compact currency string. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a network collective-performance ratio as a percentage. */
export function formatPerformance(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format an ICRC-1 ledger block index with thousands separators. */
export function formatBlockIndex(value: bigint): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}
