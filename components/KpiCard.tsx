export default function KpiCard({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta?: number | null;
  sub?: string;
}) {
  const up = delta !== null && delta !== undefined && delta >= 0;
  return (
    <div className="bg-card border border-cardBorder rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-3xl font-semibold mt-2 tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs min-h-[1rem]">
        {delta !== null && delta !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded-md font-medium ${
              up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-zinc-500">{sub}</span>}
      </div>
    </div>
  );
}
