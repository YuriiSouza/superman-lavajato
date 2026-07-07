"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { crm } from "@/lib/crm/api";

const fmt = (v: number) =>
  `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtCompact = (v: number) => {
  const abs = Math.abs(v);
  const prefix = v < 0 ? "-R$ " : "R$ ";
  if (abs >= 1000) return `${prefix}${(abs / 1000).toFixed(1)}k`;
  return `${prefix}${abs.toFixed(0)}`;
};

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function DreBarChart({ months }: { months: any[] }) {
  const [hov, setHov] = useState<number | null>(null);
  if (!months.length) return null;

  const W = 580,
    H = 200;
  const pL = 56,
    pR = 10,
    pT = 14,
    pB = 24;
  const iW = W - pL - pR;
  const iH = H - pT - pB;

  const maxVal = Math.max(
    ...months.flatMap((m) => [m.revenue, m.expenses + m.cmv]),
    1,
  );
  const minVal = Math.min(...months.map((m) => m.netProfit), 0);
  const range = maxVal - minVal;

  const n = months.length;
  const groupW = iW / n;
  const barW = Math.min((groupW - 6) / 3, 22);
  const GAP = (groupW - barW * 3) / 2;

  const ty = (v: number) => pT + iH - ((v - minVal) / range) * iH;
  const zeroY = ty(0);

  const yTicks = Array.from({ length: 5 }, (_, i) => minVal + (range * i) / 4);

  const BARS = [
    { key: "revenue", color: "#22c55e", label: "Receita" },
    {
      key: "totalExpenses",
      color: "#ef4444",
      label: "Despesas (opex + contas + CMV)",
    },
    { key: "netProfit", color: "#3b82f6", label: "Lucro Líquido" },
  ];

  const enriched = months.map((m) => ({
    ...m,
    totalExpenses: m.expenses + m.cmv,
  }));

  return (
    <div className="relative">
      {/* Tooltip */}
      {hov !== null && (
        <div className="absolute z-10 top-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
          <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {enriched[hov].label}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-green-600">Receita</span>
              <span className="font-medium">{fmt(enriched[hov].revenue)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-500">Opex</span>
              <span className="font-medium">{fmt(enriched[hov].opex)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-400">Contas</span>
              <span className="font-medium">
                {fmt(enriched[hov].billsPaid)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-orange-500">CMV</span>
              <span className="font-medium">{fmt(enriched[hov].cmv)}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-1 flex justify-between gap-4">
              <span
                className={
                  enriched[hov].netProfit >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                }
              >
                Lucro Líquido
              </span>
              <span
                className={`font-semibold ${enriched[hov].netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                {enriched[hov].netProfit < 0 ? "-" : ""}
                {fmt(enriched[hov].netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={() => setHov(null)}
      >
        {/* Y ticks */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={pL}
              y1={ty(v)}
              x2={W - pR}
              y2={ty(v)}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
            <text
              x={pL - 5}
              y={ty(v) + 3.5}
              textAnchor="end"
              fontSize="7.5"
              fill="#9ca3af"
            >
              {fmtCompact(v)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {minVal < 0 && (
          <line
            x1={pL}
            y1={zeroY}
            x2={W - pR}
            y2={zeroY}
            stroke="#6b7280"
            strokeOpacity="0.3"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
        )}

        {/* Bars */}
        {enriched.map((m, gi) => {
          const gx = pL + gi * groupW;
          return (
            <g
              key={gi}
              onMouseEnter={() => setHov(gi)}
              style={{ cursor: "pointer" }}
            >
              {/* invisible hover zone */}
              <rect
                x={gx}
                y={pT}
                width={groupW}
                height={iH}
                fill="transparent"
              />

              {BARS.map((bar, bi) => {
                const val = (m as any)[bar.key];
                const y1 = ty(Math.max(val, 0));
                const y2 = ty(Math.min(val, 0));
                const barH = Math.abs(y2 - y1);
                const barX = gx + GAP + bi * (barW + 1);
                return (
                  <rect
                    key={bar.key}
                    x={barX}
                    y={val >= 0 ? y1 : zeroY}
                    width={barW}
                    height={Math.max(barH, 1)}
                    fill={bar.color}
                    opacity={hov === gi ? 1 : 0.75}
                    rx="2"
                  />
                );
              })}

              {/* X label */}
              <text
                x={gx + groupW / 2}
                y={H - 5}
                textAnchor="middle"
                fontSize="8"
                fill={hov === gi ? "#374151" : "#9ca3af"}
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 pl-12">
        {BARS.map((b) => (
          <div key={b.key} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: b.color }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ResultadoPage() {
  const [data, setData] = useState<any>(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  const load = async (m = months) => {
    setLoading(true);
    const d = await crm.financial.dre(m);
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const fmt2 = (v: number) => {
    const color =
      v >= 0
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";
    return (
      <span className={color}>
        {v < 0 ? "-" : "+"}
        {fmt(v)}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Resultado (DRE)
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Demonstrativo de resultado do exercício
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMonths(m);
                  load(m);
                }}
                className={`px-3 py-1.5 transition-colors ${
                  months === m
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
          <button
            onClick={() => load()}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        data && (
          <>
            {/* Totais do período */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <TrendingUp
                      size={14}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Receita total
                  </span>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {fmt(data.totals.revenue)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <TrendingDown size={14} className="text-red-500" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Despesas + CMV
                  </span>
                </div>
                <p className="text-lg font-bold text-red-500">
                  {fmt(data.totals.expenses + data.totals.cmv)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                    <Minus size={14} className="text-orange-500" />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    CMV (produtos)
                  </span>
                </div>
                <p className="text-lg font-bold text-orange-500">
                  {fmt(data.totals.cmv)}
                </p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  data.totals.netProfit >= 0
                    ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      data.totals.netProfit >= 0
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : "bg-red-100 dark:bg-red-900/40"
                    }`}
                  >
                    {data.totals.netProfit >= 0 ? (
                      <TrendingUp
                        size={14}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    ) : (
                      <TrendingDown size={14} className="text-red-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Lucro líquido
                  </span>
                </div>
                <p
                  className={`text-lg font-bold ${
                    data.totals.netProfit >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {data.totals.netProfit < 0 ? "-" : ""}
                  {fmt(data.totals.netProfit)}
                </p>
                {data.totals.revenue > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    margem{" "}
                    {(
                      (data.totals.netProfit / data.totals.revenue) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                )}
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Receita × Despesas × Lucro — últimos {months} meses
              </h2>
              <DreBarChart months={data.months} />
            </div>

            {/* Tabela mensal */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Detalhamento por mês
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      {[
                        "Mês",
                        "Receita",
                        "Sangrias",
                        "Contas pagas",
                        "CMV",
                        "Total despesas",
                        "Lucro líquido",
                        "Margem",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[...data.months].reverse().map((m: any) => (
                      <tr
                        key={m.label}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {m.label}
                        </td>
                        <td className="px-4 py-2.5 text-green-600 dark:text-green-400">
                          {fmt(m.revenue)}
                        </td>
                        <td className="px-4 py-2.5 text-red-500">
                          {fmt(m.opex)}
                        </td>
                        <td className="px-4 py-2.5 text-red-400">
                          {fmt(m.billsPaid)}
                        </td>
                        <td className="px-4 py-2.5 text-orange-500">
                          {fmt(m.cmv)}
                        </td>
                        <td className="px-4 py-2.5 text-red-500 font-medium">
                          {fmt(m.expenses + m.cmv)}
                        </td>
                        <td className="px-4 py-2.5 font-semibold">
                          {fmt2(m.netProfit)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">
                          {m.revenue > 0
                            ? `${((m.netProfit / m.revenue) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nota sobre dados */}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              * Receita = OS pagas no período. Sangrias = saídas do caixa.
              Contas = Bills marcadas como pagas. CMV = custo dos produtos
              consumidos em OS.
            </p>
          </>
        )
      )}
    </div>
  );
}
