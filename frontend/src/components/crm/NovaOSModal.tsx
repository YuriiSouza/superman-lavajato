"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, User, ChevronLeft, Car, Tag } from "lucide-react";
import { crm } from "@/lib/crm/api";

const PAYMENT_OPTIONS = ["PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO"];
const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Crédito",
  CARTAO_DEBITO: "Débito",
};
const VEHICLE_TYPES = ["SEDAN", "SUV", "HATCH", "PICKUP", "MOTO", "OUTRO"];

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NovaOSModal({ open, onClose, onSuccess }: Props) {
  // Step: 1 = service selection, 2 = client/vehicle or description, 3 = details
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — service
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Step 2 — client/vehicle (requiresVehicle) or description (no vehicle)
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [dropRect, setDropRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "" });
  const [savingClient, setSavingClient] = useState(false);

  const [clientVehicles, setClientVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [newVehicleMode, setNewVehicleMode] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate: "",
    model: "",
    color: "",
    type: "SEDAN",
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  const [customerDescription, setCustomerDescription] = useState("");

  // Step 3 — details
  const [totalValue, setTotalValue] = useState("");
  const [scheduledAt, setScheduledAt] = useState(
    toLocalDatetimeValue(new Date()),
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const requiresVehicle = selectedService?.category?.requiresVehicle ?? true;

  const resetAll = useCallback(() => {
    setStep(1);
    setSelectedService(null);
    setClientQuery("");
    setClientResults([]);
    setShowDrop(false);
    setDropRect(null);
    setSelectedClient(null);
    setNewClientMode(false);
    setNewClient({ name: "", phone: "" });
    setClientVehicles([]);
    setSelectedVehicle(null);
    setNewVehicleMode(false);
    setNewVehicle({ plate: "", model: "", color: "", type: "SEDAN" });
    setCustomerDescription("");
    setTotalValue("");
    setNotes("");
    setScheduledAt(toLocalDatetimeValue(new Date()));
  }, []);

  useEffect(() => {
    if (open) {
      setLoadingServices(true);
      crm.services.list()
        .then(setServices)
        .catch(() => setServices([]))
        .finally(() => setLoadingServices(false));
    } else {
      resetAll();
    }
  }, [open, resetAll]);

  // Debounced client search — cancela buscas antigas para evitar respostas fora de ordem
  useEffect(() => {
    if (selectedClient || clientQuery.length < 2) {
      setClientResults([]);
      setShowDrop(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await crm.clients.list(clientQuery);
        if (cancelled) return;
        setClientResults(Array.isArray(res) ? res : []);
        openDropdown();
      } catch {
        if (!cancelled) setClientResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientQuery, selectedClient]);

  function openDropdown() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropRect({ top: r.bottom + 4, left: r.left, width: r.width });
      setShowDrop(true);
    }
  }

  function selectClient(client: any) {
    setSelectedClient(client);
    setClientQuery(client.name);
    setShowDrop(false);
    setClientVehicles(client.vehicles ?? []);
    setSelectedVehicle(
      client.vehicles?.length === 1 ? client.vehicles[0] : null,
    );
    setNewVehicleMode(false);
  }

  function clearClient() {
    setSelectedClient(null);
    setClientQuery("");
    setClientVehicles([]);
    setSelectedVehicle(null);
    setNewVehicleMode(false);
    setShowDrop(false);
  }

  async function handleCreateClient() {
    if (!newClient.name || !newClient.phone) return;
    setSavingClient(true);
    try {
      const created = await crm.clients.create(newClient);
      selectClient({ ...created, vehicles: [] });
      setNewClientMode(false);
      setNewVehicleMode(true);
    } finally {
      setSavingClient(false);
    }
  }

  async function handleCreateVehicle() {
    if (!newVehicle.model || !selectedClient) return;
    setSavingVehicle(true);
    try {
      const created = await crm.vehicles.create({
        ...newVehicle,
        clientId: selectedClient.id,
      });
      const updated = [...clientVehicles, created];
      setClientVehicles(updated);
      setSelectedVehicle(created);
      setNewVehicleMode(false);
      setNewVehicle({ plate: "", model: "", color: "", type: "SEDAN" });
    } finally {
      setSavingVehicle(false);
    }
  }

  function selectService(svc: any) {
    setSelectedService(svc);
    setTotalValue(String(svc.price));
    setStep(2);
  }

  function canAdvanceStep2() {
    if (requiresVehicle) return !!selectedClient && !!selectedVehicle;
    return customerDescription.trim().length > 0;
  }

  async function handleSubmit() {
    if (!selectedService || !totalValue) return;
    setSaving(true);
    try {
      await crm.orders.create({
        serviceId: selectedService.id,
        clientId: requiresVehicle ? selectedClient?.id : undefined,
        vehicleId: requiresVehicle ? selectedVehicle?.id : undefined,
        customerDescription: !requiresVehicle ? customerDescription : undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        totalValue: parseFloat(totalValue),
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // Group services by category
  const grouped: Record<string, { category: any; services: any[] }> = {};
  for (const svc of services) {
    const key = svc.category?.id ?? "__sem_categoria__";
    if (!grouped[key])
      grouped[key] = { category: svc.category ?? null, services: [] };
    grouped[key].services.push(svc);
  }
  const groups = Object.values(grouped);

  // Client dropdown portal
  const dropdown =
    showDrop && !selectedClient && dropRect
      ? createPortal(
          <div
            style={{
              position: "fixed",
              top: dropRect.top,
              left: dropRect.left,
              width: dropRect.width,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-56 overflow-y-auto"
          >
            {searching && (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2.5">
                Buscando...
              </p>
            )}
            {!searching && clientResults.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2.5">
                Nenhum cliente encontrado
              </p>
            )}
            {clientResults.map((c) => (
              <button
                key={c.id}
                onMouseDown={() => selectClient(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {c.phone}
                  {c.vehicles?.length > 0 &&
                    ` · ${c.vehicles.map((v: any) => v.plate).join(", ")}`}
                </p>
              </button>
            ))}
            <button
              onMouseDown={() => {
                setNewClientMode(true);
                setShowDrop(false);
                setNewClient({ name: clientQuery, phone: "" });
              }}
              className="w-full text-left px-3 py-2.5 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
            >
              <Plus size={14} /> Criar novo cliente
            </button>
          </div>,
          document.body,
        )
      : null;

  const stepLabel =
    step === 1
      ? "Serviço"
      : step === 2
        ? requiresVehicle
          ? "Cliente & veículo"
          : "Identificação"
        : "Detalhes";

  return (
    <>
      {dropdown}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg w-full max-w-xl relative max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Nova ordem de serviço
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Passo {step} de 3 — {stepLabel}
                </p>
              </div>
            </div>
            <button onClick={onClose}>
              <X
                size={18}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              />
            </button>
          </div>

          {/* Body */}
          <div
            className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
            onScroll={() => setShowDrop(false)}
          >
            {/* ── STEP 1: Serviço ── */}
            {step === 1 && (
              <div className="space-y-4">
                {loadingServices ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Carregando serviços...
                    </p>
                  </div>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                    Nenhum serviço cadastrado ainda.
                  </p>
                ) : null}
                {!loadingServices &&
                  groups.map((g) => (
                    <div key={g.category?.id ?? "sem"}>
                    <div className="flex items-center gap-2 mb-2">
                      {g.category ? (
                        <Tag size={13} className="text-blue-400" />
                      ) : (
                        <Car size={13} className="text-gray-400" />
                      )}
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {g.category?.name ?? "Sem categoria"}
                      </span>
                      {g.category && !g.category.requiresVehicle && (
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
                          sem veículo
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {g.services.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => selectService(svc)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {svc.name}
                            </span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              R$ {Number(svc.price).toFixed(2)}
                            </span>
                          </div>
                          {svc.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                              {svc.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 2: Cliente/veículo ou descrição ── */}
            {step === 2 && requiresVehicle && (
              <div className="space-y-5">
                {/* Cliente */}
                <section>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Cliente
                  </p>
                  {!newClientMode ? (
                    <div>
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                          ref={inputRef}
                          className={`${inputCls} pl-8 pr-8`}
                          placeholder="Buscar por nome, telefone ou placa..."
                          value={clientQuery}
                          onChange={(e) => {
                            setClientQuery(e.target.value);
                            if (selectedClient) clearClient();
                          }}
                          onFocus={() =>
                            clientResults.length > 0 &&
                            !selectedClient &&
                            openDropdown()
                          }
                          onBlur={() =>
                            setTimeout(() => setShowDrop(false), 150)
                          }
                        />
                        {(clientQuery || selectedClient) && (
                          <button
                            onClick={clearClient}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      {selectedClient && (
                        <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                          <User
                            size={14}
                            className="text-blue-500 dark:text-blue-400 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                              {selectedClient.name}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {selectedClient.phone}
                            </p>
                          </div>
                        </div>
                      )}
                      {!showDrop && !selectedClient && (
                        <button
                          onClick={() => {
                            setNewClientMode(true);
                            setNewClient({ name: clientQuery, phone: "" });
                          }}
                          className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Criar novo cliente
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-800/60">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Novo cliente
                      </p>
                      <input
                        className={inputCls}
                        placeholder="Nome *"
                        value={newClient.name}
                        onChange={(e) =>
                          setNewClient((p) => ({ ...p, name: e.target.value }))
                        }
                      />
                      <input
                        className={inputCls}
                        placeholder="Telefone *"
                        value={newClient.phone}
                        onChange={(e) =>
                          setNewClient((p) => ({ ...p, phone: e.target.value }))
                        }
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setNewClientMode(false)}
                          className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCreateClient}
                          disabled={
                            savingClient || !newClient.name || !newClient.phone
                          }
                          className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingClient ? "Criando..." : "Criar cliente"}
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Veículo */}
                {selectedClient && (
                  <section>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Veículo
                    </p>
                    {clientVehicles.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {clientVehicles.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVehicle(v);
                              setNewVehicleMode(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              selectedVehicle?.id === v.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            <span className="font-mono text-xs font-semibold">
                              {v.plate}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              {v.model}
                            </span>
                            {v.color && (
                              <span className="text-gray-400 dark:text-gray-500 ml-1">
                                · {v.color}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {!newVehicleMode ? (
                      <button
                        onClick={() => setNewVehicleMode(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} />
                        {clientVehicles.length === 0
                          ? "Adicionar veículo"
                          : "Adicionar outro veículo"}
                      </button>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-800/60">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Novo veículo
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className={inputCls}
                            placeholder="Placa"
                            value={newVehicle.plate}
                            onChange={(e) =>
                              setNewVehicle((p) => ({
                                ...p,
                                plate: e.target.value.toUpperCase(),
                              }))
                            }
                          />
                          <input
                            className={inputCls}
                            placeholder="Modelo *"
                            value={newVehicle.model}
                            onChange={(e) =>
                              setNewVehicle((p) => ({
                                ...p,
                                model: e.target.value,
                              }))
                            }
                          />
                          <input
                            className={inputCls}
                            placeholder="Cor"
                            value={newVehicle.color}
                            onChange={(e) =>
                              setNewVehicle((p) => ({
                                ...p,
                                color: e.target.value,
                              }))
                            }
                          />
                          <select
                            className={inputCls}
                            value={newVehicle.type}
                            onChange={(e) =>
                              setNewVehicle((p) => ({
                                ...p,
                                type: e.target.value,
                              }))
                            }
                          >
                            {VEHICLE_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setNewVehicleMode(false);
                              setNewVehicle({
                                plate: "",
                                model: "",
                                color: "",
                                type: "SEDAN",
                              });
                            }}
                            className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleCreateVehicle}
                            disabled={savingVehicle || !newVehicle.model}
                            className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
                          >
                            {savingVehicle
                              ? "Adicionando..."
                              : "Adicionar veículo"}
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* ── STEP 2: Descrição (sem veículo) ── */}
            {step === 2 && !requiresVehicle && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição do item *
                  </label>
                  <input
                    className={inputCls}
                    placeholder="Ex: Moto Honda CG 2020, Quadriciclo, Tapete 3m²..."
                    value={customerDescription}
                    onChange={(e) => setCustomerDescription(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Descreva o que será lavado/higienizado.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Detalhes ── */}
            {step === 3 && (
              <div className="space-y-4">
                {selectedService && (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Serviço:
                    </span>{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedService.name}
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data e hora
                  </label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!canAdvanceStep2()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                Continuar
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={saving || !totalValue}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Criando..." : "Criar OS"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
