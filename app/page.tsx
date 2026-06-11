import { supabaseAdmin } from "@/lib/supabase";
import { getProfile, IgProfile } from "@/lib/instagram";
import {
  DailyRow,
  MediaRow,
  GOAL,
  windowRows,
  previousWindowRows,
  sum,
  pctChange,
  engagementRate,
  latestFollowers,
  projection,
  fmt,
  fmtCompact,
  PERIODS,
} from "@/lib/metrics";
import KpiCard from "@/components/KpiCard";
import PeriodSelector from "@/components/PeriodSelector";
import TopContent from "@/components/TopContent";
import AudiencePanel from "@/components/AudiencePanel";
import { FollowersChart, ReachViewsChart, InteractionsChart } from "@/components/Charts";
import ContentChart, { ContentPoint } from "@/components/ContentChart";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { p?: string };
}) {
  const period = PERIODS.some((x) => x.key === searchParams.p)
    ? (searchParams.p as string)
    : "30";

  const sb = supabaseAdmin();
  const [dailyRes, mediaRes, audRes, storiesRes] = await Promise.all([
    sb.from("daily_metrics").select("*").order("date", { ascending: true }),
    sb.from("media").select("*").order("timestamp", { ascending: false }).limit(300),
    sb.from("audience").select("*").eq("id", "latest").maybeSingle(),
    sb.from("stories").select("*").order("timestamp", { ascending: false }).limit(100),
  ]);

  const daily = (dailyRes.data ?? []) as DailyRow[];
  const allMedia = (mediaRes.data ?? []) as MediaRow[];
  const audience = audRes.data ?? null;

  let profile: IgProfile | null = null;
  try {
    profile = await getProfile();
  } catch {
    // sin token válido se sigue mostrando lo almacenado
  }

  const cur = windowRows(daily, period);
  const prev = previousWindowRows(daily, period);

  const followers = profile?.followers_count ?? latestFollowers(daily);
  const goalPct = followers ? Math.min((followers / GOAL) * 100, 100) : 0;
  const proj = projection(cur, followers);

  const kpis = [
    {
      label: "Alcance",
      value: fmtCompact(sum(cur, "reach")),
      delta: pctChange(sum(cur, "reach"), sum(prev, "reach")),
    },
    {
      label: "Visualizaciones",
      value: fmtCompact(sum(cur, "views")),
      delta: pctChange(sum(cur, "views"), sum(prev, "views")),
    },
    {
      label: "Interacciones",
      value: fmtCompact(sum(cur, "interactions")),
      delta: pctChange(sum(cur, "interactions"), sum(prev, "interactions")),
    },
    {
      label: "Likes",
      value: fmtCompact(sum(cur, "likes")),
      delta: pctChange(sum(cur, "likes"), sum(prev, "likes")),
    },
    {
      label: "Comentarios",
      value: fmtCompact(sum(cur, "comments")),
      delta: pctChange(sum(cur, "comments"), sum(prev, "comments")),
    },
    {
      label: "Guardados",
      value: fmtCompact(sum(cur, "saves")),
      delta: pctChange(sum(cur, "saves"), sum(prev, "saves")),
    },
    {
      label: "Compartidos",
      value: fmtCompact(sum(cur, "shares")),
      delta: pctChange(sum(cur, "shares"), sum(prev, "shares")),
    },
    {
      label: "Engagement",
      value: engagementRate(cur) !== null ? `${engagementRate(cur)!.toFixed(2)}%` : "—",
      delta: pctChange(engagementRate(cur) ?? 0, engagementRate(prev) ?? 0),
      sub: "interacciones / alcance",
    },
  ];

  // Top contenidos del periodo (o todos si el periodo no tiene suficientes)
  const periodDays = PERIODS.find((x) => x.key === period)?.days;
  const cutoffDate = periodDays
    ? new Date(Date.now() - periodDays * 86400000).toISOString()
    : null;
  let topMedia = cutoffDate
    ? allMedia.filter((m) => m.timestamp >= cutoffDate)
    : allMedia;
  if (topMedia.length < 6) topMedia = allMedia;
  topMedia = [...topMedia]
    .sort(
      (a, b) =>
        (b.interactions ?? b.like_count ?? 0) - (a.interactions ?? a.like_count ?? 0)
    )
    .slice(0, 12);

  const newFollowers = sum(cur, "follower_delta");

  // Gráficas por tipo de contenido: alcance, views y ER por pieza (últimas 20)
  const toPoints = (
    list: {
      timestamp: string;
      reach: number | null;
      views: number | null;
      interactions: number | null;
    }[],
    max = 20
  ): ContentPoint[] =>
    list
      .slice(0, max)
      .reverse()
      .map((m) => ({
        label: new Date(m.timestamp).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        }),
        reach: m.reach,
        views: m.views,
        er: m.reach
          ? Number((((m.interactions ?? 0) / m.reach) * 100).toFixed(2))
          : null,
      }));

  const postPoints = toPoints(allMedia.filter((m) => m.media_product_type === "FEED"));
  const reelPoints = toPoints(allMedia.filter((m) => m.media_product_type === "REELS"));
  const storyPoints = toPoints((storiesRes.data ?? []) as any[]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile?.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_picture_url}
              alt="Alba Lez"
              className="w-14 h-14 rounded-full ring-2 ring-accent/50"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-accent to-accent2" />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile?.name ?? "Alba Lez"}
            </h1>
            <p className="text-sm text-zinc-500">
              @{profile?.username ?? "albalez"} · {fmt(profile?.media_count)} publicaciones
            </p>
          </div>
        </div>
        <PeriodSelector current={period} />
      </header>

      {/* Objetivo 1M */}
      <section className="bg-card border border-cardBorder rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Camino a 1M</p>
            <p className="text-4xl font-bold tracking-tight mt-1">
              {fmt(followers)}{" "}
              <span className="text-lg font-normal text-zinc-500">/ 1.000.000 seguidores</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
              {goalPct.toFixed(1)}%
            </p>
            {proj && (
              <p className="text-xs text-zinc-500 mt-1">
                +{fmt(proj.perDay)}/día · 1M estimado:{" "}
                {proj.eta.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>
        <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        {newFollowers > 0 && (
          <p className="text-xs text-zinc-500 mt-3">
            +{fmt(newFollowers)} nuevos seguidores en el periodo seleccionado
          </p>
        )}
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </section>

      {/* Gráficas */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-cardBorder rounded-2xl p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Evolución de seguidores</h2>
          {cur.filter((r) => r.followers_count).length >= 2 ? (
            <FollowersChart data={cur as any} />
          ) : (
            <p className="text-sm text-zinc-600 py-20 text-center">
              El histórico de seguidores se construye día a día con los snapshots.
              <br />
              Vuelve mañana para ver la curva.
            </p>
          )}
        </div>
        <div className="bg-card border border-cardBorder rounded-2xl p-5">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">Alcance y visualizaciones</h2>
          {cur.length > 0 ? (
            <ReachViewsChart data={cur as any} />
          ) : (
            <p className="text-sm text-zinc-600 py-20 text-center">Sin datos aún.</p>
          )}
        </div>
      </section>

      <section className="bg-card border border-cardBorder rounded-2xl p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Interacciones diarias</h2>
        {cur.length > 0 ? (
          <InteractionsChart data={cur as any} />
        ) : (
          <p className="text-sm text-zinc-600 py-10 text-center">Sin datos aún.</p>
        )}
      </section>

      {/* Rendimiento por tipo de contenido */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Rendimiento por contenido</h2>
        <div className="bg-card border border-cardBorder rounded-2xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            📸 Posts <span className="text-zinc-600">· alcance, views y ER de los últimos 20</span>
          </h3>
          {postPoints.length > 0 ? (
            <ContentChart data={postPoints} />
          ) : (
            <p className="text-sm text-zinc-600 py-10 text-center">Sin posts sincronizados aún.</p>
          )}
        </div>
        <div className="bg-card border border-cardBorder rounded-2xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            🎬 Reels <span className="text-zinc-600">· alcance, views y ER de los últimos 20</span>
          </h3>
          {reelPoints.length > 0 ? (
            <ContentChart data={reelPoints} />
          ) : (
            <p className="text-sm text-zinc-600 py-10 text-center">Sin reels sincronizados aún.</p>
          )}
        </div>
        <div className="bg-card border border-cardBorder rounded-2xl p-5">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">
            ⏳ Stories <span className="text-zinc-600">· se capturan 2 veces al día mientras están activas; el histórico crece desde hoy</span>
          </h3>
          {storyPoints.length > 0 ? (
            <ContentChart data={storyPoints} />
          ) : (
            <p className="text-sm text-zinc-600 py-10 text-center">
              Aún no hay stories registradas. Las próximas que publiques se capturarán automáticamente.
            </p>
          )}
        </div>
      </section>

      {/* Top contenidos */}
      <section>
        <h2 className="text-lg font-semibold mb-4">🏆 Mejores contenidos</h2>
        <TopContent media={topMedia} />
      </section>

      {/* Audiencia */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Audiencia</h2>
        <AudiencePanel audience={audience} />
      </section>

      <footer className="text-center text-xs text-zinc-600 pb-4">
        Datos: Instagram Graph API · Actualización automática diaria a las 06:00 UTC
      </footer>
    </main>
  );
}
