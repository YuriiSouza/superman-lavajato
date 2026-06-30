'use client';

import { useEffect, useState, useCallback } from 'react';
import { crm } from '@/lib/crm/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type AppointmentStatus = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';

type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicle: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  service: { id: string; name: string; duration: number; price: number };
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDENTE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  CONFIRMADO: 'bg-green-500/10 text-green-400 border-green-500/30',
  CANCELADO: 'bg-red-500/10 text-red-400 border-red-500/30',
  CONCLUIDO: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

const STATUS_NEXT: Record<AppointmentStatus, AppointmentStatus | null> = {
  PENDENTE: 'CONFIRMADO',
  CONFIRMADO: 'CONCLUIDO',
  CANCELADO: null,
  CONCLUIDO: null,
};

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fmtDate(isoDate: string) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

export default function AgendaPage() {
  const [date, setDate] = useState(toISO(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const data = await crm.appointments.listByDate(d);
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  function shiftDay(delta: number) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setDate(toISO(d));
  }

  async function advance(appt: Appointment) {
    const next = STATUS_NEXT[appt.status];
    if (!next) return;
    setUpdating(appt.id);
    try {
      await crm.appointments.updateStatus(appt.id, next);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: next } : a)),
      );
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  }

  async function cancel(appt: Appointment) {
    if (appt.status === 'CANCELADO') return;
    setUpdating(appt.id);
    try {
      await crm.appointments.updateStatus(appt.id, 'CANCELADO');
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'CANCELADO' } : a)),
      );
    } catch {
      // silently fail
    } finally {
      setUpdating(null);
    }
  }

  const isToday = date === toISO(new Date());
  const pending = appointments.filter((a) => a.status === 'PENDENTE').length;
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMADO').length;

  return (
    <div className="min-h-screen bg-ink-950 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="mt-1 text-sm text-zinc-400">Gerencie os agendamentos do dia</p>
        </div>

        {/* Date nav */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900 px-4 py-3">
          <button
            onClick={() => shiftDay(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-white capitalize">{fmtDate(date)}</p>
            {isToday && (
              <span className="mt-0.5 inline-block rounded-full bg-kawasaki-500/20 px-2 py-0.5 text-xs font-medium text-kawasaki-400">
                Hoje
              </span>
            )}
          </div>

          <button
            onClick={() => shiftDay(1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Stats pills */}
        {!loading && appointments.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 bg-ink-900 px-3 py-1.5 text-xs font-medium text-zinc-300">
              {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}
            </span>
            {pending > 0 && (
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400">
                {pending} pendente{pending !== 1 ? 's' : ''}
              </span>
            )}
            {confirmed > 0 && (
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                {confirmed} confirmado{confirmed !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink-900" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-900 px-6 py-16 text-center">
            <p className="text-zinc-500">Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              .slice()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((appt) => {
                const isBusy = updating === appt.id;
                const nextStatus = STATUS_NEXT[appt.status];
                return (
                  <div
                    key={appt.id}
                    className="rounded-2xl border border-white/10 bg-ink-900 p-5 transition-colors"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      {/* Time block */}
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-center min-w-[64px]">
                          <p className="text-sm font-bold text-white">{appt.startTime}</p>
                          <p className="text-xs text-zinc-500">{appt.endTime}</p>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white">{appt.clientName}</p>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[appt.status]}`}>
                              {STATUS_LABELS[appt.status]}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-400">{appt.vehicle}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {appt.service.name}
                            {' · '}
                            {fmtDuration(appt.service.duration)}
                            {' · '}
                            <a
                              href={`https://wa.me/55${appt.clientPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-kawasaki-400 hover:underline"
                            >
                              {appt.clientPhone}
                            </a>
                          </p>
                          {appt.notes && (
                            <p className="mt-1.5 text-xs text-zinc-500 italic">"{appt.notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {nextStatus && (
                          <button
                            onClick={() => advance(appt)}
                            disabled={isBusy}
                            className="rounded-xl border border-kawasaki-500/40 bg-kawasaki-500/10 px-3 py-1.5 text-xs font-semibold text-kawasaki-400 hover:bg-kawasaki-500/20 transition-colors disabled:opacity-50"
                          >
                            {isBusy ? '...' : `Marcar ${STATUS_LABELS[nextStatus]}`}
                          </button>
                        )}
                        {appt.status !== 'CANCELADO' && appt.status !== 'CONCLUIDO' && (
                          <button
                            onClick={() => cancel(appt)}
                            disabled={isBusy}
                            className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
