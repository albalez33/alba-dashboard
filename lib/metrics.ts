export type DailyRow = {
  date: string;
  followers_count: number | null;
  follower_delta: number | null;
  reach: number | null;
  views: number | null;
  interactions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
  profile_views: number | null;
  accounts_engaged: number | null;
};

export type MediaRow = {
  id: string;
  caption: string | null;
  media_type: string;
  media_product_type: string;
  permalink: string;
  media_url: string | null;
  thumbnail_url: string | null;
  timestamp: string;
  like_count: number | null;
  comments_count: number | null;
  views: number | null;
  reach: number | null;
  saves: number | null;
  shares: number | null;
  interactions: number | null;
};

export const GOAL = 1_000_000;

export const PERIODS: { key: string; label: string; days: number | null }[] = [
  { key: "7", label: "7 días", days: 7 },
  { key: "30", label: "30 días", days: 30 },
  { key: "90", label: "90 días", days: 90 },
  { key: "365", label: "1 año", days: 365 },
  { key: "all", label: "Histórico", days: null },
];

function cutoff(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function windowRows(rows: DailyRow[], periodKey: string): DailyRow[] {
  const p = PERIODS.find((x) => x.key === periodKey) ?? PERIODS[1];
  if (p.days === null) return rows;
  const c = cutoff(p.days);
  return rows.filter((r) => r.date >= c);
}

export function previousWindowRows(rows: DailyRow[], periodKey: string): DailyRow[] {
  const p = PERIODS.find((x) => x.key === periodKey) ?? PERIODS[1];
  if (p.days === null) return [];
  const c1 = cutoff(p.days);
  const c2 = cutoff(p.days * 2);
  return rows.filter((r) => r.date >= c2 && r.date < c1);
}

export function sum(rows: DailyRow[], field: keyof DailyRow): number {
  return rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
}

export function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

// Engagement = interacciones / alcance del periodo
export function engagementRate(rows: DailyRow[]): number | null {
  const reach = sum(rows, "reach");
  if (!reach) return null;
  return (sum(rows, "interactions") / reach) * 100;
}

export function latestFollowers(rows: DailyRow[]): number | null {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].followers_count) return rows[i].followers_count;
  }
  return null;
}

// Proyección hacia 1M según el crecimiento medio del periodo
export function projection(rows: DailyRow[], currentFollowers: number | null) {
  if (!currentFollowers || currentFollowers >= GOAL) return null;
  const withFollowers = rows.filter((r) => r.followers_count);
  if (withFollowers.length >= 2) {
    const first = withFollowers[0];
    const last = withFollowers[withFollowers.length - 1];
    const days =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000;
    const gained = (last.followers_count ?? 0) - (first.followers_count ?? 0);
    if (days > 0 && gained > 0) {
      const perDay = gained / days;
      const remaining = GOAL - currentFollowers;
      const eta = new Date(Date.now() + (remaining / perDay) * 86400000);
      return { perDay: Math.round(perDay), eta };
    }
  }
  return null;
}

export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-ES").format(Math.round(n));
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
