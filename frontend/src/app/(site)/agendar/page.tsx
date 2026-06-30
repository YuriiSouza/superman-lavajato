'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, ClockIcon, BoltIcon } from '@/components/icons';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Service = { id: string; name: string; price: number; duration: number; description: string | null };

type Step = 'service' | 'datetime' | 'info' | 'done';

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  CONCLUIDO: 'Concluído',
};

function fmt(price: number) {
  return `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${m}min` : `${h}h`;
}

// gera datas disponíveis a partir de hoje (exceto domingo), para os próximos 30 dias
function getAvailableDates(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 30 && dates.length < 20; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (d.getDay() === 0) continue; // pula domingo
    const value = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    dates.push({ value, label });
  }
  return dates;
}

const DATES = getAvailableDates();

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-white/10 bg-ink-950 text-sm text-white placeholder:text-zinc-500 focus:border-kawasaki-500 focus:outline-none transition-colors';

export default function AgendarPage() {
  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({ clientName: '', clientPhone: '', vehicle: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/services?activeOnly=true`)
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    fetch(`${API}/appointments/slots?date=${selectedDate}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBooking(data);
      setStep('done');
    } catch {
      setError('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 pt-28 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">

        {/* Cabeçalho */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-kawasaki-500/40 bg-kawasaki-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-kawasaki-300">
            <BoltIcon className="h-4 w-4" />
            Agendamento online
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            Agende sua lavagem
          </h1>
          <p className="mt-2 text-zinc-400">
            Escolha o serviço, data e horário. Confirmamos em até 1h.
          </p>
        </div>

        {/* Steps indicator */}
        {step !== 'done' && (
          <div className="mb-8 flex items-center gap-2">
            {(['service', 'datetime', 'info'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-kawasaki-500 text-ink-950'
                    : ['datetime', 'info'].indexOf(step) > ['datetime', 'info'].indexOf(s) || (step === 'info' && s !== 'info')
                      ? 'bg-kawasaki-500/20 text-kawasaki-400'
                      : 'bg-white/10 text-zinc-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === s ? 'text-white' : 'text-zinc-500'}`}>
                  {s === 'service' ? 'Serviço' : s === 'datetime' ? 'Data e hora' : 'Seus dados'}
                </span>
                {i < 2 && <div className="h-px w-6 bg-white/10" />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: serviço ── */}
        {step === 'service' && (
          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-900" />
                ))}
              </div>
            ) : (
              services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('datetime'); }}
                  className="w-full rounded-2xl border border-white/10 bg-ink-900 p-5 text-left transition-all hover:border-kawasaki-500/50 hover:bg-kawasaki-500/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{s.name}</p>
                      {s.description && (
                        <p className="mt-0.5 text-sm text-zinc-400">{s.description}</p>
                      )}
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {fmtDuration(s.duration)}
                      </p>
                    </div>
                    <span className="shrink-0 text-lg font-bold text-kawasaki-400">{fmt(s.price)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── Step 2: data e horário ── */}
        {step === 'datetime' && selectedService && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-kawasaki-500/30 bg-kawasaki-500/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{selectedService.name}</p>
                <p className="text-xs text-zinc-400">{fmtDuration(selectedService.duration)} · {fmt(selectedService.price)}</p>
              </div>
              <button onClick={() => setStep('service')} className="text-xs text-kawasaki-400 hover:underline">
                Trocar
              </button>
            </div>

            {/* Datas */}
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-300">Escolha uma data</p>
              <div className="flex flex-wrap gap-2">
                {DATES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedDate === d.value
                        ? 'border-kawasaki-500 bg-kawasaki-500/10 text-kawasaki-400'
                        : 'border-white/10 bg-ink-900 text-zinc-300 hover:border-kawasaki-500/40'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horários */}
            {selectedDate && (
              <div>
                <p className="mb-3 text-sm font-medium text-zinc-300">Escolha um horário</p>
                {slotsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-10 w-20 animate-pulse rounded-xl bg-ink-900" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum horário disponível para esta data.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                          selectedSlot === slot
                            ? 'border-kawasaki-500 bg-kawasaki-500/10 text-kawasaki-400'
                            : 'border-white/10 bg-ink-900 text-zinc-300 hover:border-kawasaki-500/40'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep('info')}
              disabled={!selectedDate || !selectedSlot}
              className="w-full rounded-full bg-kawasaki-500 py-3.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400 disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── Step 3: dados do cliente ── */}
        {step === 'info' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-kawasaki-500/30 bg-kawasaki-500/5 p-4 space-y-1">
              <p className="text-sm font-semibold text-white">{selectedService?.name}</p>
              <p className="text-xs text-zinc-400">
                {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                {' · '}{selectedSlot}
              </p>
              <button type="button" onClick={() => setStep('datetime')} className="text-xs text-kawasaki-400 hover:underline">
                Alterar
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome completo *</label>
              <input required value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="Seu nome" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">WhatsApp / Telefone *</label>
              <input required value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                placeholder="(62) 99999-9999" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Veículo *</label>
              <input required value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                placeholder="Ex: Onix Prata 2022" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Observações</label>
              <textarea value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Alguma observação especial?" rows={2}
                className={`${inputCls} resize-none`} />
            </div>

            {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

            <button
              type="submit" disabled={submitting}
              className="w-full rounded-full bg-kawasaki-500 py-3.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400 disabled:opacity-60"
            >
              {submitting ? 'Agendando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}

        {/* ── Done ── */}
        {step === 'done' && booking && (
          <div className="rounded-3xl border border-kawasaki-500/30 bg-kawasaki-500/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-kawasaki-500">
              <CheckIcon className="h-8 w-8 text-ink-950" />
            </div>
            <h2 className="text-2xl font-bold text-white">Agendado!</h2>
            <p className="mt-2 text-zinc-400">
              Entraremos em contato pelo WhatsApp para confirmar seu horário.
            </p>
            <div className="mt-6 space-y-2 text-left rounded-2xl border border-white/10 bg-ink-900 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Serviço</span>
                <span className="font-medium text-white">{booking.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data</span>
                <span className="font-medium text-white">
                  {new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Horário</span>
                <span className="font-medium text-white">{booking.startTime} – {booking.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Status</span>
                <span className="font-medium text-kawasaki-400">{STATUS_LABELS[booking.status]}</span>
              </div>
            </div>
            <button
              onClick={() => { setStep('service'); setSelectedService(null); setSelectedDate(''); setSelectedSlot(''); setForm({ clientName: '', clientPhone: '', vehicle: '', notes: '' }); setBooking(null); }}
              className="mt-6 rounded-full border border-kawasaki-500 px-6 py-2.5 text-sm font-semibold text-kawasaki-400 hover:bg-kawasaki-500 hover:text-ink-950 transition-colors"
            >
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
