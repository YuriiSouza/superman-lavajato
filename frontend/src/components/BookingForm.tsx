"use client";

import { useState } from "react";
import type { Service } from "@/lib/services";
import { WhatsAppIcon } from "./icons";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-ink-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-kawasaki-500 focus:outline-none";

const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-300";

function formatPrice(price: string | number): string {
  return `R$ ${Number(price).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

interface Props {
  services: Service[];
  whatsappPhone: string;
}

export function BookingForm({ services, whatsappPhone }: Props) {
  const defaultService = services.find((s) => s.highlight)?.name ?? services[0]?.name ?? "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(defaultService);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const lines = [
      "Olá! Gostaria de agendar uma lavagem no Superman Lava a Jato. 🦸",
      "",
      `*Nome:* ${name || "—"}`,
      `*Telefone:* ${phone || "—"}`,
      `*Serviço:* ${service}`,
      date ? `*Data:* ${formatDate(date)}` : null,
      time ? `*Horário:* ${time}` : null,
      notes ? `*Observações:* ${notes}` : null,
    ].filter(Boolean);

    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
      lines.join("\n"),
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-ink-900 p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Telefone / WhatsApp
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="service" className={labelClass}>
            Serviço desejado
          </label>
          <select
            id="service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={inputClass}
          >
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} — {formatPrice(s.price)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            Data preferencial
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>

        <div>
          <label htmlFor="time" className={labelClass}>
            Horário preferencial
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClass}>
            Observações (opcional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Modelo do carro, opcionais desejados, etc."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-kawasaki-500 px-7 py-3.5 text-base font-semibold text-ink-950 transition-colors hover:bg-kawasaki-400"
      >
        <WhatsAppIcon className="h-5 w-5" />
        Enviar agendamento pelo WhatsApp
      </button>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Ao enviar, abriremos o WhatsApp com seus dados já preenchidos para
        confirmar o horário.
      </p>
    </form>
  );
}

function formatDate(value: string) {
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}
