import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = supabaseAdmin();
  const daily = await sb.from("daily_metrics").select("*").order("date");
  const media = await sb.from("media").select("id").limit(3);
  const aud = await sb.from("audience").select("id").limit(3);
  return NextResponse.json({
    supabase_url: process.env.SUPABASE_URL ?? null,
    key_prefix: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 12),
    daily_count: daily.data?.length ?? null,
    daily_error: daily.error?.message ?? null,
    daily_first: daily.data?.[0] ?? null,
    daily_last: daily.data?.[daily.data.length - 1] ?? null,
    media_count: media.data?.length ?? null,
    media_error: media.error?.message ?? null,
    audience_error: aud.error?.message ?? null,
  });
}
