"use client";

import {
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export type ContentPoint = {
  label: string;
  reach: number | null;
  views: number | null;
  er: number | null; // engagement rate % (interacciones / alcance)
};

const NAMES: Record<string, string> = { reach: "Alcance", views: "Views", er: "ER %" };

export default function ContentChart({ data }: { data: ContentPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1d2230" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" stroke="#52525b" fontSize={11} tickMargin={8} />
        <YAxis yAxisId="left" tickFormatter={fmtCompact} stroke="#52525b" fontSize={12} width={50} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: any) => `${v}%`}
          stroke="#a855f7"
          fontSize={12}
          width={45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#11141d",
            border: "1px solid #1d2230",
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(v: any, name: any) => [
            name === "er" ? `${v}%` : new Intl.NumberFormat("es-ES").format(Number(v)),
            NAMES[name] ?? name,
          ]}
        />
        <Legend formatter={(v: any) => NAMES[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="reach" fill="#ec4899" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="left" dataKey="views" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="er"
          stroke="#a855f7"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
