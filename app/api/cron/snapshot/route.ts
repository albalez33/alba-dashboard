import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import * as ig from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TOTAL_METRICS = [
  "views",
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "profile_views",
  "accounts_engaged",
];

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function unixDayStart(daysAgo: number): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return Math.floor(d.getTime() / 1000);
}

export async function GET(req: NextRequest) {
  // Autorización: header de Vercel Cron o ?secret= para ejecución manual
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const qsSecret = req.nextUrl.searchParams.get("secret");
  if (secret && auth !== `Bearer ${secret}` && qsSecret !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // backfill=N días hacia atrás (máx 30, lo que permite la API). Por defecto 2.
  const backfill = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("backfill") ?? "2", 10), 1),
    30
  );

  const sb = supabaseAdmin();
  const log: Record<string, unknown> = {};

  // 1) Perfil → seguidores totales de hoy
  const profile = await ig.getProfile();
  const today = dayStr(new Date());
  await sb
    .from("daily_metrics")
    .upsert({ date: today, followers_count: profile.followers_count }, { onConflict: "date" });
  log.followers_count = profile.followers_count;

  // 2) Series diarias (reach + nuevos seguidores) de los últimos N días
  // La API limita la ventana a 30 días exactos (2.592.000 s): recortamos con margen
  const until = Math.floor(Date.now() / 1000);
  const since = Math.max(unixDayStart(backfill), until - 2592000 + 7200);
  const rows = new Map<string, Record<string, unknown>>();

  const [reachSeries, followerSeries] = await Promise.all([
    ig.getDailySeries("reach", since, until).catch((e) => {
      log.reach_series_error = String(e);
      return [];
    }),
    ig.getDailySeries("follower_count", since, until).catch(() => []),
  ]);
  for (const v of reachSeries) {
    const d = v.end_time.slice(0, 10);
    rows.set(d, { ...(rows.get(d) ?? {}), date: d, reach: v.value });
  }
  for (const v of followerSeries) {
    const d = v.end_time.slice(0, 10);
    rows.set(d, { ...(rows.get(d) ?? {}), date: d, follower_delta: v.value });
  }

  // 3) Métricas de total por día (views, interacciones, likes...)
  for (let i = backfill; i >= 0; i--) {
    const s = unixDayStart(i);
    const u = i === 0 ? until : unixDayStart(i - 1);
    try {
      const totals = await ig.getTotals(TOTAL_METRICS, s, u);
      const d = dayStr(new Date(s * 1000));
      rows.set(d, {
        ...(rows.get(d) ?? {}),
        date: d,
        views: totals.views ?? null,
        interactions: totals.total_interactions ?? null,
        likes: totals.likes ?? null,
        comments: totals.comments ?? null,
        shares: totals.shares ?? null,
        saves: totals.saves ?? null,
        profile_views: totals.profile_views ?? null,
        accounts_engaged: totals.accounts_engaged ?? null,
      });
    } catch (e) {
      log[`totals_error_day_${i}`] = String(e);
    }
  }

  if (rows.size > 0) {
    const { error } = await sb
      .from("daily_metrics")
      .upsert(Array.from(rows.values()), { onConflict: "date" });
    if (error) log.daily_upsert_error = error.message;
  }
  log.days_upserted = rows.size;

  // 4) Publicaciones recientes + insights por publicación
  const media = await ig.getMedia(50);
  const mediaRows = await Promise.all(
    media.map(async (m) => {
      const ins = await ig.getMediaInsights(m.id);
      return {
        id: m.id,
        caption: m.caption?.slice(0, 500) ?? null,
        media_type: m.media_type,
        media_product_type: m.media_product_type,
        permalink: m.permalink,
        media_url: m.media_url ?? null,
        thumbnail_url: m.thumbnail_url ?? null,
        timestamp: m.timestamp,
        like_count: m.like_count ?? null,
        comments_count: m.comments_count ?? null,
        views: ins?.views ?? null,
        reach: ins?.reach ?? null,
        saves: ins?.saved ?? null,
        shares: ins?.shares ?? null,
        interactions: ins?.total_interactions ?? null,
        updated_at: new Date().toISOString(),
      };
    })
  );
  if (mediaRows.length > 0) {
    const { error } = await sb.from("media").upsert(mediaRows, { onConflict: "id" });
    if (error) log.media_upsert_error = error.message;
  }
  log.media_upserted = mediaRows.length;

  // 5) Audiencia (demografía + seguidores online)
  const [country, city, age, gender, online] = await Promise.all([
    ig.getDemographics("country"),
    ig.getDemographics("city"),
    ig.getDemographics("age"),
    ig.getDemographics("gender"),
    ig.getOnlineFollowers(),
  ]);
  const { error: audError } = await sb.from("audience").upsert(
    {
      id: "latest",
      country,
      city,
      age,
      gender,
      online_followers: online,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (audError) log.audience_upsert_error = audError.message;

  return NextResponse.json({ ok: true, ...log });
}
