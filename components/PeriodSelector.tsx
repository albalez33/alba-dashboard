import Link from "next/link";
import { PERIODS } from "@/lib/metrics";

export default function PeriodSelector({ current }: { current: string }) {
  return (
    <div className="flex gap-1 bg-card border border-cardBorder rounded-xl p-1">
      {PERIODS.map((p) => (
        <Link
          key={p.key}
          href={`/?p=${p.key}`}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            current === p.key
              ? "bg-gradient-to-r from-accent to-accent2 text-white font-medium"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
