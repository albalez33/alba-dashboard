// Cliente para Instagram Graph API (cuenta Business/Creator)
const GRAPH = "https://graph.facebook.com/v23.0";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

async function igGet<T = any>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const qs = new URLSearchParams({ ...params, access_token: env("IG_ACCESS_TOKEN") });
  const res = await fetch(`${GRAPH}/${path}?${qs}`, { cache: "no-store" });
  const json = await res.json();
  if (json.error) {
    throw new Error(`IG API ${path}: ${json.error.message} (code ${json.error.code})`);
  }
  return json as T;
}

export type IgProfile = {
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
};

export async function getProfile(): Promise<IgProfile> {
  return igGet(env("IG_USER_ID"), {
    fields:
      "username,name,profile_picture_url,followers_count,follows_count,media_count",
  });
}

// Métricas con serie diaria (time series): reach, follower_count
export async function getDailySeries(
  metric: "reach" | "follower_count",
  since: number,
  until: number
): Promise<{ value: number; end_time: string }[]> {
  const json = await igGet<any>(`${env("IG_USER_ID")}/insights`, {
    metric,
    period: "day",
    since: String(since),
    until: String(until),
  });
  return json.data?.[0]?.values ?? [];
}

// Métricas de valor total para una ventana (views, interacciones, likes...)
export async function getTotals(
  metrics: string[],
  since: number,
  until: number
): Promise<Record<string, number>> {
  const json = await igGet<any>(`${env("IG_USER_ID")}/insights`, {
    metric: metrics.join(","),
    period: "day",
    metric_type: "total_value",
    since: String(since),
    until: String(until),
  });
  const out: Record<string, number> = {};
  for (const m of json.data ?? []) out[m.name] = m.total_value?.value ?? 0;
  return out;
}

// Seguidores online por hora (si está disponible)
export async function getOnlineFollowers(): Promise<
  { end_time: string; value: Record<string, number> }[]
> {
  try {
    const json = await igGet<any>(`${env("IG_USER_ID")}/insights`, {
      metric: "online_followers",
      period: "lifetime",
    });
    return json.data?.[0]?.values ?? [];
  } catch {
    return []; // no disponible en todas las cuentas
  }
}

// Demografía de seguidores (requiere ~100+ seguidores)
export async function getDemographics(
  breakdown: "country" | "city" | "age" | "gender"
): Promise<{ key: string; value: number }[]> {
  try {
    const json = await igGet<any>(`${env("IG_USER_ID")}/insights`, {
      metric: "follower_demographics",
      period: "lifetime",
      metric_type: "total_value",
      breakdown,
    });
    const results =
      json.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    return results.map((r: any) => ({
      key: r.dimension_values?.[0] ?? "?",
      value: r.value ?? 0,
    }));
  } catch {
    return [];
  }
}

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type: string;
  permalink: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

export async function getMedia(limit = 50): Promise<IgMedia[]> {
  const json = await igGet<any>(`${env("IG_USER_ID")}/media`, {
    fields:
      "id,caption,media_type,media_product_type,permalink,media_url,thumbnail_url,timestamp,like_count,comments_count",
    limit: String(limit),
  });
  return json.data ?? [];
}

// Insights por publicación (views, reach, saved, shares, total_interactions)
export async function getMediaInsights(
  mediaId: string
): Promise<Record<string, number> | null> {
  const metrics = "views,reach,likes,comments,saved,shares,total_interactions";
  try {
    const json = await igGet<any>(`${mediaId}/insights`, { metric: metrics });
    const out: Record<string, number> = {};
    for (const m of json.data ?? []) out[m.name] = m.values?.[0]?.value ?? 0;
    return out;
  } catch {
    return null; // algunos tipos (p. ej. álbumes antiguos) no soportan insights
  }
}
