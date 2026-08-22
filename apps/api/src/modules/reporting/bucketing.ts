import type { ReportBucket, ReportGroupBy } from "@assertquest/shared";

interface RevenueRow {
  createdAt: Date;
  priceCents: number;
}

// Buckets a shipment's createdAt (always stored in UTC) into a day/month key
// *as observed in the given IANA timezone* (FR-1302) — a shipment created at
// 2026-03-01T23:30:00Z is "2026-03-01" in UTC but "2026-03-02" in a timezone
// several hours ahead, and could even land in a different month. Two requests for
// the same UTC range with different timeZone values can legitimately produce
// different bucket counts near a day/month boundary — that's the point, not a bug.
export function bucketKey(date: Date, groupBy: ReportGroupBy, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return groupBy === "month" ? `${year}-${month}` : `${year}-${month}-${day}`;
}

export function buildBuckets(rows: RevenueRow[], groupBy: ReportGroupBy, timeZone: string): ReportBucket[] {
  const buckets = new Map<string, ReportBucket>();

  for (const row of rows) {
    const period = bucketKey(row.createdAt, groupBy, timeZone);
    const existing = buckets.get(period);
    if (existing) {
      existing.shipmentCount += 1;
      existing.revenueCents += row.priceCents;
    } else {
      buckets.set(period, { period, shipmentCount: 1, revenueCents: row.priceCents });
    }
  }

  return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
}
