import { MediaRow, fmtCompact } from "@/lib/metrics";

const TYPE_LABEL: Record<string, string> = {
  REELS: "Reel",
  FEED: "Post",
  STORY: "Story",
};

export default function TopContent({ media }: { media: MediaRow[] }) {
  if (media.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aún no hay publicaciones sincronizadas. Ejecuta el snapshot inicial.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {media.map((m, i) => {
        const img = m.thumbnail_url ?? m.media_url;
        return (
          <a
            key={m.id}
            href={m.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card border border-cardBorder rounded-2xl overflow-hidden hover:border-accent/60 transition-colors"
          >
            <div className="relative aspect-[4/5] bg-zinc-900">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={m.caption?.slice(0, 60) ?? "Publicación"}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                  Sin imagen
                </div>
              )}
              <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur">
                #{i + 1} · {TYPE_LABEL[m.media_product_type] ?? m.media_type}
              </span>
            </div>
            <div className="p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>👁 {fmtCompact(m.views ?? m.reach)}</span>
                <span>❤️ {fmtCompact(m.like_count)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>💬 {fmtCompact(m.comments_count)}</span>
                <span>🔖 {fmtCompact(m.saves)}</span>
                <span>↗︎ {fmtCompact(m.shares)}</span>
              </div>
              <p className="text-zinc-600 pt-1">
                {new Date(m.timestamp).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
