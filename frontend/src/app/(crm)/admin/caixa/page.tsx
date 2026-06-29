'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Wallet, Smartphone, ArrowDownCircle,
  AlertTriangle, CheckCircle2, Calendar, Download,
} from 'lucide-react';
import { crm } from '@/lib/crm/api';
import OSActionsWidget from '@/components/crm/OSActionsWidget';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const fmtCompact = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;

function fmtDate(str: string) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateShort(str: string) {
  const [, m, d] = str.split('-');
  return `${d}/${m}`;
}

function exportCsv(days: any[]) {
  const header = 'Data,Receita,Espécie,Digital,Sangrias,Diferença,Operador,Status';
  const body = days
    .filter((d) => d.revenue > 0 || d.session)
    .map((d) =>
      [
        fmtDate(d.date),
        d.revenue.toFixed(2),
        d.cashIn.toFixed(2),
        d.digital.toFixed(2),
        d.outflowsTotal.toFixed(2),
        d.difference !== null ? d.difference.toFixed(2) : '',
        d.session?.operatorName ?? '',
        d.session ? (d.session.closedAt ? 'Fechado' : 'Aberto') : 'Sem caixa',
      ].join(',')
    )
    .join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `caixa-historico-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── gráfico de barras SVG ─────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; revenue: number }[] }) {
  const visible = [...data].reverse().slice(-30);
  if (!visible.length)
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">Sem dados</div>;

  const W = 600, H = 168, pL = 48, pR = 8, pT = 28, pB = 26;
  const iW = W - pL - pR, iH = H - pT - pB;
  const max = Math.max(...visible.map((d) => d.revenue), 1);
  const bw = Math.max(4, iW / visible.length - 3);
  const showValueLabel = bw >= 12;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" xmlns="http://www.w3.org/2000/svg">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = pT + iH - f * iH;
        return (
          <g key={f}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={pL - 5} y={y + 3.5} textAnchor="end" fontSize="8" fill="#6b7280" opacity="1">
              {fmtCompact(max * f)}
            </text>
          </g>
        );
      })}
      {visible.map((d, i) => {
        const x = pL + (i / visible.length) * iW + (iW / visible.length - bw) / 2;
        const h = (d.revenue / max) * iH;
        const y = pT + iH - h;
        const showDateLabel = visible.length <= 15 || i % Math.ceil(visible.length / 10) === 0 || i === visible.length - 1;
        return (
          <g key={d.date}>
            <rect x={x} y={d.revenue > 0 ? y : pT + iH - 2} width={bw} height={d.revenue > 0 ? h : 2}
              rx="2" fill={d.revenue > 0 ? '#3b82f6' : '#e5e7eb'} opacity={d.revenue > 0 ? 0.85 : 0.4}>
              <title>{fmtDate(d.date)}: {fmt(d.revenue)}</title>
            </rect>
            {/* label de valor acima da barra */}
            {showValueLabel && d.revenue > 0 && (
              <text
                x={x + bw / 2} y={y - 4}
                textAnchor="middle" fontSize="6.5" fill="#6b7280"
                transform={bw < 20 ? `rotate(-45 ${x + bw / 2} ${y - 4})` : undefined}
              >
                {fmtCompact(d.revenue)}
              </text>
            )}
            {/* label de data abaixo */}
            {showDateLabel && (
              <text x={x + bw / 2} y={H - 5} textAnchor="middle" fontSize="7" fill="#9ca3af">
                {fmtDateShort(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── gráfico de contagem ───────────────────────────────────────────────────────

function CountBarChart({ data }: { data: { date: string; count: number }[] }) {
  const visible = [...data].reverse().slice(-30);
  if (!visible.length)
    return <div className="h-40 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">Sem dados</div>;

  const W = 600, H = 140, pL = 28, pR = 8, pT = 10, pB = 26;
  const iW = W - pL - pR, iH = H - pT - pB;
  const max = Math.max(...visible.map((d) => d.count), 1);
  const bw = Math.max(4, iW / visible.length - 3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" xmlns="http://www.w3.org/2000/svg">
      {[0, 0.5, 1].map((f) => {
        const y = pT + iH - f * iH;
        return (
          <g key={f}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
            <text x={pL - 4} y={y + 3.5} textAnchor="end" fontSize="7.5" fill="currentColor" opacity="0.4">
              {Math.round(max * f)}
            </text>
          </g>
        );
      })}
      {visible.map((d, i) => {
        const x = pL + (i / visible.length) * iW + (iW / visible.length - bw) / 2;
        const h = (d.count / max) * iH;
        const y = pT + iH - h;
        const showLabel = visible.length <= 15 || i % Math.ceil(visible.length / 10) === 0 || i === visible.length - 1;
        return (
          <g key={d.date}>
            <rect x={x} y={d.count > 0 ? y : pT + iH - 2} width={bw} height={d.count > 0 ? h : 2}
              rx="2" fill={d.count > 0 ? '#8b5cf6' : '#e5e7eb'} opacity={d.count > 0 ? 0.85 : 0.4}>
              <title>{fmtDate(d.date)}: {d.count} serviço{d.count !== 1 ? 's' : ''}</title>
            </rect>
            {showLabel && (
              <text x={x + bw / 2} y={H - 5} textAnchor="middle" fontSize="7" fill="currentColor" opacity="0.4">
                {fmtDateShort(d.date)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── card ──────────────────────────────────────────────────────────────────────

function Card({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={15} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

const PERIOD_OPTS = [
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '60 dias', value: 60 },
  { label: '90 dias', value: 90 },
];

export default function CaixaDashboardPage() {
  const router = useRouter();
  const [days, setDays] = useState<number>(() => {
    try { return Number(localStorage.getItem('caixa_dash_days')) || 30; } catch { return 30; }
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    crm.cash.history(days).then(setData).finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    try { localStorage.setItem('caixa_dash_days', String(days)); } catch {}
    load();
  }, [load, days]);

  const totals = data?.totals;
  const allDays: any[] = data?.days ?? [];
  const daysWithActivity = allDays.filter((d) => d.revenue > 0 || d.session);
  const avgRevenue = totals?.daysWithSession > 0 ? totals.revenue / totals.daysWithSession : 0;
  const biggestDiff = allDays.reduce((max: any, d) => {
    if (d.difference === null) return max;
    return Math.abs(d.difference) > Math.abs(max?.difference ?? 0) ? d : max;
  }, null);

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-x-hidden">

      {/* ── cabeçalho ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard do Caixa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Histórico e análise financeira</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 shrink-0">
            {PERIOD_OPTS.map((o) => (
              <button key={o.value} onClick={() => setDays(o.value)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  days === o.value
                    ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => data && exportCsv(allDays)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <Download size={13} /> <span className="hidden sm:inline">CSV</span>
          </button>
          <OSActionsWidget />
        </div>
      </div>

      {/* ── cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          icon={TrendingUp}
          label={`Faturamento (${days}d)`}
          value={loading ? '—' : fmt(totals?.revenue ?? 0)}
          sub={`${totals?.orders ?? 0} OS pagas`}
          color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
        />
        <Card
          icon={Calendar}
          label="Média por dia com caixa"
          value={loading ? '—' : fmt(avgRevenue)}
          sub={`${totals?.daysWithSession ?? 0} dias registrados`}
          color="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
        />
        <Card
          icon={ArrowDownCircle}
          label="Total em sangrias"
          value={loading ? '—' : fmt(totals?.outflows ?? 0)}
          sub="retiradas do caixa"
          color="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
        />
        <Card
          icon={AlertTriangle}
          label="Dias com divergência"
          value={loading ? '—' : (totals?.daysWithDiff ?? 0)}
          sub={biggestDiff ? `Maior: ${fmt(Math.abs(biggestDiff.difference))}` : 'Nenhuma divergência'}
          color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── gráfico ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Receita diária</h2>
        {loading
          ? <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          : <BarChart data={allDays.map((d) => ({ date: d.date, revenue: d.revenue }))} />
        }
      </div>

      {/* ── tabela de histórico ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Histórico de caixas
          </h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-2 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />)}
          </div>
        ) : daysWithActivity.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
            Nenhum dado no período.
          </p>
        ) : (
          <>
            {/* cabeçalho da tabela */}
            <div className="hidden md:grid grid-cols-[120px_1fr_1fr_1fr_1fr_110px_100px] gap-3 px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
              <span>Data</span>
              <span>Receita</span>
              <span>Espécie</span>
              <span>Digital</span>
              <span>Sangrias</span>
              <span>Diferença</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {daysWithActivity.map((d) => {
                const hasDiff = d.difference !== null && Math.abs(d.difference) >= 0.01;
                const isOpen = d.session && !d.session.closedAt;
                const isToday = d.date === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={d.date}
                    onClick={() => isToday && router.push('/admin/financeiro')}
                    className={`grid grid-cols-2 md:grid-cols-[120px_1fr_1fr_1fr_1fr_110px_100px] gap-3 px-4 py-3 text-sm items-center ${
                      isToday ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30' : ''
                    }`}
                  >
                    {/* data */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {fmtDate(d.date)}
                        {isToday && (
                          <span className="ml-1.5 text-xs text-blue-600 dark:text-blue-400 font-normal">hoje</span>
                        )}
                      </p>
                      {d.session?.operatorName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{d.session.operatorName}</p>
                      )}
                    </div>

                    {/* receita */}
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{fmt(d.revenue)}</p>

                    {/* espécie */}
                    <p className="text-gray-600 dark:text-gray-300 hidden md:block">{fmt(d.cashIn)}</p>

                    {/* digital */}
                    <p className="text-gray-600 dark:text-gray-300 hidden md:block">{fmt(d.digital)}</p>

                    {/* sangrias */}
                    <p className={`hidden md:block ${d.outflowsTotal > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {d.outflowsTotal > 0 ? `−${fmt(d.outflowsTotal)}` : '—'}
                    </p>

                    {/* diferença */}
                    <div className="hidden md:flex items-center gap-1">
                      {d.difference === null ? (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      ) : hasDiff ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${
                          d.difference < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          <AlertTriangle size={11} />
                          {d.difference < 0 ? '-' : '+'}{fmt(Math.abs(d.difference))}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 size={11} /> OK
                        </span>
                      )}
                    </div>

                    {/* status */}
                    <div>
                      {!d.session ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Sem caixa</span>
                      ) : isOpen ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium">
                          Aberto
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                          Fechado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── resumo espécie vs digital ── */}
      {!loading && totals && (totals.revenue > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Espécie vs Digital
            </h2>
            {(() => {
              const totalCash = allDays.reduce((s, d) => s + d.cashIn, 0);
              const totalDigital = allDays.reduce((s, d) => s + d.digital, 0);
              const total = totalCash + totalDigital || 1;
              const pctCash = (totalCash / total) * 100;
              const pctDigital = (totalDigital / total) * 100;
              return (
                <div className="space-y-3">
                  {[
                    { label: 'Dinheiro', value: totalCash, pct: pctCash, color: 'bg-green-500' },
                    { label: 'Digital (Pix + Cartão)', value: totalDigital, pct: pctDigital, color: 'bg-blue-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className="text-gray-500 dark:text-gray-400">{fmt(item.value)} · {item.pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Dias com divergência no fechamento
            </h2>
            {allDays.filter((d) => d.difference !== null && Math.abs(d.difference) >= 0.01).length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 py-4">
                <CheckCircle2 size={16} />
                Nenhuma divergência no período.
              </div>
            ) : (
              <div className="space-y-2">
                {allDays
                  .filter((d) => d.difference !== null && Math.abs(d.difference) >= 0.01)
                  .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
                  .slice(0, 5)
                  .map((d) => (
                    <div key={d.date} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{fmtDate(d.date)}</span>
                      <span className={`font-medium ${d.difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {d.difference < 0 ? 'Faltou' : 'Sobrou'} {fmt(Math.abs(d.difference))}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
