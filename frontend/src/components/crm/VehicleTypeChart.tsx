'use client';

import { useEffect, useState } from 'react';
import { crm } from '@/lib/crm/api';

const LABELS: Record<string, string> = {
  SEDAN: 'Sedan', SUV: 'SUV', HATCH: 'Hatch',
  PICKUP: 'Pickup', MOTO: 'Moto', OUTRO: 'Outro',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function donutPath(cx: number, cy: number, r: number, r2: number, startAngle: number, endAngle: number) {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const s = toRad(startAngle), e = toRad(endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)}`,
    `A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`,
    `L ${cx + r2 * Math.cos(e)} ${cy + r2 * Math.sin(e)}`,
    `A ${r2} ${r2} 0 ${large} 0 ${cx + r2 * Math.cos(s)} ${cy + r2 * Math.sin(s)}`,
    'Z',
  ].join(' ');
}

export default function VehicleTypeChart({ days = 90 }: { days?: number }) {
  const [data, setData] = useState<{ type: string; count: number; revenue: number }[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    crm.financial.byVehicleType(days).then(setData).catch(() => {});
  }, [days]);

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400 dark:text-gray-500">
      Sem dados no período
    </div>
  );

  const cx = 80, cy = 80, R = 70, r = 42;
  let angle = 0;
  const slices = data.map((d, i) => {
    const sweep = (d.count / total) * 360;
    const slice = { ...d, color: COLORS[i % COLORS.length], start: angle, end: angle + sweep };
    angle += sweep;
    return slice;
  });

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* donut */}
      <svg width={160} height={160} className="shrink-0">
        {slices.map((s) => (
          <path
            key={s.type}
            d={donutPath(cx, cy, R, r, s.start, s.end < s.start + 360 ? s.end : s.end - 0.01)}
            fill={s.color}
            opacity={hovered && hovered !== s.type ? 0.35 : 1}
            onMouseEnter={() => setHovered(s.type)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer transition-opacity"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-700 dark:fill-gray-200" fontSize={22} fontWeight={700}>
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-400" fontSize={10}>
          OS
        </text>
      </svg>

      {/* legenda */}
      <ul className="flex-1 space-y-2 min-w-0">
        {slices.map((s) => (
          <li
            key={s.type}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHovered(s.type)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{LABELS[s.type] ?? s.type}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{s.count} OS</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 ml-2">{fmt(s.revenue)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
