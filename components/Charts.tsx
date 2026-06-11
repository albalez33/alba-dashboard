"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });

const tooltipStyle = {
  backgroundColor: "#11141d",
  border: "1px solid #1d2230",
  borderRadius: 12,
  fontSize: 13,
};

type Point = Record<string, string | number | null>;

export function FollowersChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1d2230" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#52525b" fontSize={12} tickMargin={8} />
        <YAxis tickFormatter={fmtCompact} stroke="#52525b" fontSize={12} width={50} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(d: any) => fmtDate(String(d))}
          formatter={(v: any) => [new Intl.NumberFormat("es-ES").format(Number(v)), "Seguidores"]}
        />
        <Area
          type="monotone"
          dataKey="followers_count"
          stroke="#a855f7"
          strokeWidth={2.5}
          fill="url(#gFollowers)"
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReachViewsChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1d2230" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#52525b" fontSize={12} tickMargin={8} />
        <YAxis tickFormatter={fmtCompact} stroke="#52525b" fontSize={12} width={50} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(d: any) => fmtDate(String(d))}
          formatter={(v: any, name: any) => [
            new Intl.NumberFormat("es-ES").format(Number(v)),
            name === "views" ? "Visualizaciones" : "Alcance",
          ]}
        />
        <Area type="monotone" dataKey="views" stroke="#38bdf8" strokeWidth={2} fill="url(#gViews)" connectNulls />
        <Area type="monotone" dataKey="reach" stroke="#ec4899" strokeWidth={2} fill="url(#gReach)" connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function InteractionsChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1d2230" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#52525b" fontSize={12} tickMargin={8} />
        <YAxis tickFormatter={fmtCompact} stroke="#52525b" fontSize={12} width={50} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(d: any) => fmtDate(String(d))}
          formatter={(v: any) => [new Intl.NumberFormat("es-ES").format(Number(v)), "Interacciones"]}
          cursor={{ fill: "#ffffff08" }}
        />
        <Bar dataKey="interactions" fill="#a855f7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
