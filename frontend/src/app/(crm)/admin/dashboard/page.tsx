'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Zap, TrendingDown, Clock, AlertCircle,
  Plus, Download, MessageCircle, Car,
} from 'lucide-react';
import Link from 'next/link';
import { crm } from '@/lib/crm/api';
import OSActionsWidget from '@/components/crm/OSActionsWidget';

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando', EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído', PAGO: 'Pago', CANCELADO: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CONCLUIDO: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  PAGO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  CANCELADO: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const PERIOD_TABS = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'custom', label: 'Período' },
] as const;
type Period = typeof PERIOD_TABS[number]['key'];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtCompact(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
}

function getDateRange(period: Period, customStart: string, customEnd: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { start: today.toISOString(), end: now.toISOString(), days: 1 };
    case '7d': {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: s.toISOString(), end: now.toISOString(), days: 7 };
    }
    case '30d': {
      const s = new Date(today); s.setDate(today.getDate() - 29);
      return { start: s.toISOString(), end: now.toISOString(), days: 30 };
    }
    case 'month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s.toISOString(), end: now.toISOString(), days: now.getDate() };
    }
    case 'year': {
      const s = new Date(now.getFullYear(), 0, 1);
      const days = Math.ceil((now.getTime() - s.getTime()) / 86400000);
      return { start: s.toISOString(), end: now.toISOString(), days };
    }
    case 'custom': {
      if (!customStart || !customEnd) return null;
      const s = new Date(customStart + 'T00:00:00');
      const e = new Date(customEnd + 'T23:59:59');
      const days = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1;
      return { start: s.toISOString(), end: e.toISOString(), days };
    }
  }
}

function exportCsv(rows: { date: string; revenue: number }[], period: string) {
  const header = 'Data,Faturamento (R$)';
  const body = rows.map((r) => `${r.date},${r.revenue.toFixed(2)}`).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `faturamento-${period}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── chart: multi-line (total ou por serviço) com hover tooltip ──────────────

function MultiLineChart({
  progression,
  revenueByService,
  compareServices,
}: {
  progression: { date: string; revenue: number }[];
  revenueByService: { services: string[]; days: any[] };
  compareServices: boolean;
}) {
  const W = 560, H = 160;
  const pL = 52, pR = 8, pT = 10, pB = 28;
  const iW = W - pL - pR, iH = H - pT - pB;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);

  const data = compareServices ? revenueByService.days : progression;
  const services = compareServices ? revenueByService.services : [];
  const n = data.length;

  const max = useMemo(() => {
    if (!n) return 1;
    if (compareServices)
      return Math.max(...data.flatMap((d) => services.map((s) => d[s] ?? 0)), 0.01);
    return Math.max(...(data as any[]).map((d: any) => d.revenue ?? 0), 0.01);
  }, [data, services, compareServices, n]);

  if (!n)
    return <div className="h-36 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">Sem dados no período</div>;

  const tx = (i: number) => pL + (i / Math.max(n - 1, 1)) * iW;
  const ty = (v: number) => pT + iH - (v / max) * iH;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const pxInWrap = e.clientX - rect.left;
    const vbX = (pxInWrap / rect.width) * W;
    const raw = Math.round(((vbX - pL) / iW) * (n - 1));
    const idx = Math.max(0, Math.min(n - 1, raw));
    setHovIdx(idx);
    // tooltip position: % of container
    setTooltipX(pxInWrap / rect.width);
  }

  const step = Math.max(1, Math.floor(n / 7));
  const xLabels = data.reduce((acc: any[], d: any, i: number) => {
    if (i === 0 || i === n - 1 || i % step === 0)
      acc.push({ x: tx(i), label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) });
    return acc;
  }, []);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: ty(max * f), label: fmtCompact(max * f) }));

  // tooltip content
  const hovData: any = hovIdx !== null ? data[hovIdx] : null;

  return (
    <div ref={wrapRef} className="relative select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovIdx(null)}>

      {/* tooltip box */}
      {hovIdx !== null && hovData && (
        <div
          className="pointer-events-none absolute z-10 top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs min-w-[130px]"
          style={{
            left: tooltipX > 0.65 ? undefined : `calc(${tooltipX * 100}% + 10px)`,
            right: tooltipX > 0.65 ? `calc(${(1 - tooltipX) * 100}% + 10px)` : undefined,
          }}
        >
          <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            {new Date(hovData.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          {compareServices ? (
            services.map((svc, si) => (
              <div key={svc} className="flex items-center gap-1.5 leading-5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[si % CHART_COLORS.length] }} />
                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[90px]">{svc}</span>
                <span className="ml-auto font-medium text-gray-800 dark:text-gray-100 pl-2">{fmtCompact(hovData[svc] ?? 0)}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Faturamento</span>
              <span className="ml-auto font-medium text-gray-800 dark:text-gray-100 pl-2">{fmt(hovData.revenue ?? 0)}</span>
            </div>
          )}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pL} y1={t.y} x2={W - pR} y2={t.y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={pL - 5} y={t.y + 3.5} textAnchor="end" fontSize="8" fill="#6b7280">{t.label}</text>
          </g>
        ))}

        {!compareServices && (() => {
          const prog = data as { date: string; revenue: number }[];
          const pts = prog.map((d, i) => `${tx(i)},${ty(d.revenue)}`).join(' ');
          const area = `M ${tx(0)},${pT + iH} ${prog.map((d, i) => `L ${tx(i)},${ty(d.revenue)}`).join(' ')} L ${tx(n - 1)},${pT + iH} Z`;
          return (
            <>
              <path d={area} fill="url(#areaGrad)" />
              <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {n <= 35 && prog.map((d, i) =>
                d.revenue > 0 ? (
                  <circle key={i} cx={tx(i)} cy={ty(d.revenue)} r={hovIdx === i ? 4 : 2.5}
                    fill="#3b82f6" stroke="white" strokeWidth="1.2" style={{ transition: 'r 0.1s' }} />
                ) : null
              )}
            </>
          );
        })()}

        {compareServices && services.map((svc, si) => {
          const color = CHART_COLORS[si % CHART_COLORS.length];
          const pts = (data as any[]).map((d, i) => `${tx(i)},${ty(d[svc] ?? 0)}`).join(' ');
          return (
            <g key={svc}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
                strokeLinejoin="round" strokeLinecap="round" />
              {n <= 40 && (data as any[]).map((d, i) =>
                (d[svc] ?? 0) > 0 ? (
                  <circle key={i} cx={tx(i)} cy={ty(d[svc])} r={hovIdx === i ? 3.5 : 2.2}
                    fill={color} stroke="white" strokeWidth="0.8" style={{ transition: 'r 0.1s' }} />
                ) : null
              )}
            </g>
          );
        })}

        {/* linha vertical de hover */}
        {hovIdx !== null && (
          <line x1={tx(hovIdx)} y1={pT} x2={tx(hovIdx)} y2={pT + iH}
            stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 2" />
        )}

        {xLabels.map((l: any, i: number) => (
          <text key={i} x={l.x} y={H - 5} textAnchor="middle" fontSize="7.5" fill="#9ca3af">{l.label}</text>
        ))}
      </svg>

      {compareServices && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pl-1">
          {services.map((svc, si) => (
            <div key={svc} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[si % CHART_COLORS.length] }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{svc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── service filter picker ───────────────────────────────────────────────────

function ServiceFilterPicker({
  services,
  value,
  onChange,
}: {
  services: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = services.find((s) => s.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
          value
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <span className="max-w-[120px] truncate">{selected?.name ?? 'Todos os serviços'}</span>
        <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={() => { onChange(''); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
              !value
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Todos os serviços
          </button>
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                value === s.id
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── chart: donut ───────────────────────────────────────────────────────────

function DonutChart({
  data,
  onClickService,
}: {
  data: Record<string, { count: number; revenue: number }>;
  onClickService: (name: string) => void;
}) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  if (entries.length === 0)
    return <div className="h-36 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">Sem dados</div>;

  const total = entries.reduce((s, [, v]) => s + v.revenue, 0);
  const cx = 72, cy = 72, R = 58, r = 36;
  let angle = -Math.PI / 2;

  const slices = entries.map(([name, value], i) => {
    const pct = value.revenue / total;
    const start = angle;
    const end = angle + pct * 2 * Math.PI;
    angle = end;
    const large = pct > 0.5 ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const ix1 = cx + r * Math.cos(end), iy1 = cy + r * Math.sin(end);
    const ix2 = cx + r * Math.cos(start), iy2 = cy + r * Math.sin(start);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z`;
    return { name, revenue: value.revenue, count: value.count, pct, d, color: CHART_COLORS[i] };
  });

  return (
    <svg viewBox="0 0 270 160" className="w-full" xmlns="http://www.w3.org/2000/svg">
      {slices.map((s) => (
        <path
          key={s.name} d={s.d} fill={s.color} opacity="0.85"
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={() => onClickService(s.name)}
        >
          <title>{s.name}: {fmt(s.revenue)} — {(s.pct * 100).toFixed(1)}% (clicar para filtrar)</title>
        </path>
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="8" fill="#9ca3af">Total</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="10" fontWeight="600" className="fill-gray-900 dark:fill-gray-100">{fmtCompact(total)}</text>
      {slices.map((s, i) => (
        <g key={s.name} transform={`translate(152, ${14 + i * 28})`}
          className="cursor-pointer" onClick={() => onClickService(s.name)}>
          <rect width="8" height="8" rx="2" fill={s.color} />
          <text x="12" y="8" fontSize="8.5" className="fill-gray-700 dark:fill-gray-200">
            {s.name.length > 17 ? s.name.slice(0, 16) + '…' : s.name}
          </text>
          <text x="12" y="19" fontSize="7.5" className="fill-gray-400 dark:fill-gray-500">
            {fmtCompact(s.revenue)} · {(s.pct * 100).toFixed(0)}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── chart: heatmap ─────────────────────────────────────────────────────────

function Heatmap({ matrix }: { matrix: number[][] }) {
  if (!matrix || matrix.length === 0) return null;
  const max = Math.max(...matrix.flat(), 1);

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 580 }}>
        <div className="flex mb-1 pl-8">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-xs text-gray-400 dark:text-gray-500 font-mono leading-none">
              {h % 6 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>
        {DAY_ORDER.map((day) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <div className="w-7 text-xs text-gray-400 dark:text-gray-500 text-right shrink-0 pr-1">{WEEKDAYS[day]}</div>
            {matrix[day].map((count, hour) => (
              <div
                key={hour}
                className="flex-1 h-5 rounded-sm"
                style={{ backgroundColor: `rgba(59,130,246,${count === 0 ? 0.04 : 0.08 + (count / max) * 0.85})` }}
                title={`${WEEKDAYS[day]} ${hour}h: ${count} OS`}
              />
            ))}
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-2 pl-8">
          <span className="text-xs text-gray-400 dark:text-gray-500">Menos</span>
          {[0.08, 0.3, 0.5, 0.7, 0.93].map((v) => (
            <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(59,130,246,${v})` }} />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500">Mais</span>
        </div>
      </div>
    </div>
  );
}

// ─── metric card ────────────────────────────────────────────────────────────

function Card({ icon: Icon, label, value, sub, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${onClick ? 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // filters — persisted in localStorage (initialized with defaults to avoid hydration mismatch)
  const [period, setPeriod] = useState<Period>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    try {
      setPeriod((localStorage.getItem('dash_period') as Period) || '30d');
      setCustomStart(localStorage.getItem('dash_custom_start') || '');
      setCustomEnd(localStorage.getItem('dash_custom_end') || '');
      setServiceFilter(localStorage.getItem('dash_service') || '');
    } catch {}
    setFiltersReady(true);
  }, []);

  // data
  const [dash, setDash] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [progression, setProgression] = useState<{ date: string; revenue: number }[]>([]);
  const [revenueByService, setRevenueByService] = useState<{ services: string[]; days: any[] }>({ services: [], days: [] });
  const [compareServices, setCompareServices] = useState(false);
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [reactivation, setReactivation] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Static data loaded once
  useEffect(() => {
    Promise.all([
      crm.orders.today(),
      crm.reactivation.queue(30),
      crm.services.list(),
      crm.financial.heatmap(90),
    ]).then(([orders, react, svcs, heat]) => {
      setTodayOrders(orders);
      setReactivation(react.queue?.slice(0, 5) ?? []);
      setServices(svcs);
      setHeatmap(heat.matrix ?? []);
    });
  }, []);

  // Dashboard KPIs — polled every 30s
  const loadDash = useCallback(() => {
    crm.dashboard().then(setDash).finally(() => setLoadingInit(false));
  }, []);

  useEffect(() => {
    loadDash();
    pollRef.current = setInterval(loadDash, 30_000);
    return () => clearInterval(pollRef.current);
  }, [loadDash]);

  // persiste filtros no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dash_period', period);
      localStorage.setItem('dash_custom_start', customStart);
      localStorage.setItem('dash_custom_end', customEnd);
      localStorage.setItem('dash_service', serviceFilter);
    } catch {}
  }, [period, customStart, customEnd, serviceFilter]);

  // Chart data — reloads when period / serviceFilter changes
  const loadCharts = useCallback(() => {
    const range = getDateRange(period, customStart, customEnd);
    if (!range) return;
    setLoadingCharts(true);
    const params = { start: range.start, end: range.end, serviceId: serviceFilter || undefined };
    Promise.all([
      crm.financial.summary(params),
      crm.financial.progression(params),
      crm.financial.revenueByServiceByDay({ start: range.start, end: range.end }),
    ])
      .then(([sum, prog, rbs]) => { setSummary(sum); setProgression(prog); setRevenueByService(rbs); })
      .finally(() => setLoadingCharts(false));
  }, [period, customStart, customEnd, serviceFilter]);

  useEffect(() => {
    if (!filtersReady) return;
    if (period !== 'custom' || (customStart && customEnd)) loadCharts();
  }, [loadCharts, period, customStart, customEnd, filtersReady]);

  // drill-down: click on status card
  function goOrders(status?: string) {
    router.push(`/admin/ordens${status ? `?status=${status}` : ''}`);
  }

  // drill-down: click on donut slice
  function handleDonutClick(serviceName: string) {
    const svc = services.find((s: any) => s.name === serviceName);
    if (svc) router.push(`/admin/ordens?serviceId=${svc.id}`);
  }

  const range = getDateRange(period, customStart, customEnd);
  const periodLabel = PERIOD_TABS.find((t) => t.key === period)?.label ?? '';

  return (
    <div className="p-4 md:p-6 space-y-5 overflow-x-hidden">
      {/* ── header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
          {filtersReady && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => progression.length && exportCsv(progression, periodLabel)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={13} /> Exportar CSV
          </button>
          <OSActionsWidget onSuccess={loadDash} />
        </div>
      </div>

      {/* ── filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Period tabs — scroll horizontal no mobile */}
        <div className="overflow-x-auto">
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 w-max">
          {PERIOD_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                period === t.key
                  ? 'bg-white dark:bg-gray-700 font-medium shadow-sm text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        {/* Service filter */}
        {services.length > 0 && (
          <ServiceFilterPicker
            services={services}
            value={serviceFilter}
            onChange={setServiceFilter}
          />
        )}

        {loadingCharts && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* ── metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          icon={DollarSign}
          label={`Faturamento (${periodLabel})`}
          value={fmt(summary?.total ?? 0)}
          sub={`${summary?.ordersCount ?? 0} OS pagas`}
          color="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
        />
        <Card
          icon={Zap}
          label="Ticket médio"
          value={fmt(summary?.avgTicket ?? 0)}
          sub="no período"
          color="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
        />
        <Card
          icon={AlertCircle}
          label="Pendentes agora"
          value={loadingInit ? '—' : (dash?.orders?.pending ?? 0)}
          sub={`${dash?.orders?.active ?? 0} em andamento`}
          color="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400"
          onClick={() => goOrders('PENDENTE')}
        />
        <Card
          icon={TrendingDown}
          label="Clientes sumidos"
          value={loadingInit ? '—' : (dash?.clients?.churn ?? 0)}
          sub={`de ${dash?.clients?.total ?? 0} clientes`}
          color="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
        />
      </div>

      {/* ── line + donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {compareServices ? 'Faturamento por serviço' : 'Tendência de faturamento'}
            </h2>
            <button
              onClick={() => setCompareServices((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                compareServices
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-medium'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${compareServices ? 'bg-blue-500' : 'bg-gray-400'}`} />
              Comparar serviços
            </button>
          </div>
          {loadingCharts
            ? <div className="h-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            : <MultiLineChart
                progression={progression}
                revenueByService={revenueByService}
                compareServices={compareServices}
              />
          }
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Serviços mais procurados</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Clique para filtrar</p>
          {loadingCharts
            ? <div className="h-36 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            : <DonutChart data={summary?.byService ?? {}} onClickService={handleDonutClick} />
          }
        </div>
      </div>

      {/* ── heatmap ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Horários de pico (últimos 90 dias)</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">apenas OS pagas</span>
        </div>
        {heatmap.length > 0
          ? <Heatmap matrix={heatmap} />
          : <div className="h-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        }
      </div>

      {/* ── today's orders + reactivation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ordens de hoje</h2>
            <Link href="/admin/ordens" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </Link>
          </div>
          {todayOrders.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhuma ordem hoje ainda.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {todayOrders.slice(0, 6).map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-500 mr-1">{o.vehicle?.plate}</span>
                      {o.client?.name}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{o.service?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100 shrink-0">{fmt(Number(o.totalValue))}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Reativação urgente</h2>
            <Link href="/admin/reativacao" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Ver fila
            </Link>
          </div>
          {reactivation.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhum cliente na fila.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {reactivation.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {c.vehicle ?? 'sem veículo'} · {c.daysSince ?? '?'} dias
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(c.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 shrink-0"
                  >
                    <MessageCircle size={13} /> Enviar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── forma de pagamento (hoje) ── */}
      {dash?.today?.byPayment && Object.keys(dash.today.byPayment).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Formas de pagamento hoje
          </h2>
          <div className="flex gap-6 flex-wrap">
            {Object.entries(dash.today.byPayment).map(([method, value]: any) => (
              <div key={method}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{method}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
