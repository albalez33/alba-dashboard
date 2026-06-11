type Item = { key: string; value: number };

const GENDER_LABEL: Record<string, string> = { F: "Mujeres", M: "Hombres", U: "Sin especificar" };

function Bars({ items, max = 8 }: { items: Item[]; max?: number }) {
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, max);
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  if (sorted.length === 0)
    return <p className="text-sm text-zinc-600">No disponible aún.</p>;
  return (
    <div className="space-y-2.5">
      {sorted.map((it) => {
        const pct = (it.value / total) * 100;
        return (
          <div key={it.key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-300">{GENDER_LABEL[it.key] ?? it.key}</span>
              <span className="text-zinc-500">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OnlineHeatmap({ data }: { data: { value: Record<string, number> }[] }) {
  if (!data || data.length === 0)
    return <p className="text-sm text-zinc-600">No disponible aún.</p>;
  // Media por hora del día (0–23) a lo largo de los días disponibles
  const sums = new Array(24).fill(0);
  const counts = new Array(24).fill(0);
  for (const d of data) {
    for (const [h, v] of Object.entries(d.value ?? {})) {
      const hour = parseInt(h, 10);
      if (hour >= 0 && hour < 24) {
        sums[hour] += v;
        counts[hour]++;
      }
    }
  }
  const avgs = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
  const max = Math.max(...avgs, 1);
  const best = avgs.indexOf(Math.max(...avgs));
  return (
    <div>
      <div className="grid grid-cols-12 gap-1.5">
        {avgs.map((v, h) => (
          <div key={h} className="flex flex-col items-center gap-1">
            <div
              className="w-full rounded-md"
              style={{
                height: 36,
                background: `rgba(168, 85, 247, ${0.08 + 0.85 * (v / max)})`,
              }}
              title={`${h}:00 · ${Math.round(v)} seguidores online`}
            />
            <span className="text-[9px] text-zinc-600">{h % 3 === 0 ? `${h}h` : ""}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-3">
        Mejor hora para publicar: <span className="text-accent font-medium">{best}:00–{best + 1}:00</span>
      </p>
    </div>
  );
}

export default function AudiencePanel({
  audience,
}: {
  audience: {
    country?: Item[];
    city?: Item[];
    age?: Item[];
    gender?: Item[];
    online_followers?: { value: Record<string, number> }[];
  } | null;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card border border-cardBorder rounded-2xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">🌍 Países</h3>
        <Bars items={audience?.country ?? []} />
      </div>
      <div className="bg-card border border-cardBorder rounded-2xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">🏙 Ciudades</h3>
        <Bars items={audience?.city ?? []} max={6} />
      </div>
      <div className="bg-card border border-cardBorder rounded-2xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">🎂 Edad y género</h3>
        <Bars items={audience?.age ?? []} max={5} />
        <div className="mt-4 pt-4 border-t border-cardBorder">
          <Bars items={audience?.gender ?? []} max={3} />
        </div>
      </div>
      <div className="bg-card border border-cardBorder rounded-2xl p-5">
        <h3 className="text-sm font-medium text-zinc-300 mb-4">🕐 Seguidores online</h3>
        <OnlineHeatmap data={audience?.online_followers ?? []} />
      </div>
    </div>
  );
}
