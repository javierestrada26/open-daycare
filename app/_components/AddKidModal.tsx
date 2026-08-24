"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomVm } from "../_lib/kids";
import { createKid } from "@/app/_actions/kids";

type FormState = {
  name: string;
  birthdate: string;
  sala: string;
  allergies: string;
  medicalNotes: string;
};

type AddKidModalProps = {
  rooms: RoomVm[];
};

function emptyForm(rooms: RoomVm[]): FormState {
  return {
    name: "",
    birthdate: "",
    sala: rooms[0]?.id ?? "",
    allergies: "",
    medicalNotes: "",
  };
}

export function AddKidModal({ rooms }: AddKidModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(rooms));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setForm(emptyForm(rooms));
    setError(null);
    setSaving(false);
  }, [rooms]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    const result = await createKid({
      fullName: form.name,
      birthDate: form.birthdate,
      roomId: form.sala,
      allergiesText: form.allergies,
      medicalNotes: form.medicalNotes,
    });
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-[18px] py-[11px] rounded-[14px] text-white font-extrabold text-[14.5px] bg-[linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar niño
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]"
          style={{ background: "var(--color-modal-overlay)" }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[520px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-[26px] py-5 border-b border-border-cream">
              <button
                type="button"
                onClick={close}
                className="text-ink-muted text-[15px] font-bold"
              >
                Cancelar
              </button>
              <span className="font-display text-[18px] font-semibold text-ink">
                Agregar niño
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-primary text-[15px] font-extrabold"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>

            <div className="px-[26px] py-6">
              <div className="mb-[18px]">
                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                  NOMBRE COMPLETO
                </div>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Martina López"
                  className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink outline-none"
                />
              </div>

              <div className="flex gap-[14px] mb-[18px]">
                <div className="flex-1">
                  <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                    FECHA DE NACIMIENTO
                  </div>
                  <input
                    type="text"
                    value={form.birthdate}
                    onChange={(e) =>
                      setForm({ ...form, birthdate: e.target.value })
                    }
                    placeholder="dd/mm/aaaa"
                    className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink outline-none"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                    SALA
                  </div>
                  <div className="relative">
                    <select
                      value={form.sala}
                      onChange={(e) =>
                        setForm({ ...form, sala: e.target.value })
                      }
                      className="w-full appearance-none px-[16px] py-[13px] pr-[40px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink font-bold outline-none"
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B0A290"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-[18px]">
                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                  ALERGIAS (ETIQUETAS)
                </div>
                <input
                  value={form.allergies}
                  onChange={(e) =>
                    setForm({ ...form, allergies: e.target.value })
                  }
                  placeholder="Ej. Maní, Lactosa"
                  className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink outline-none"
                />
              </div>

              <div>
                <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                  NOTAS MÉDICAS
                </div>
                <textarea
                  value={form.medicalNotes}
                  onChange={(e) =>
                    setForm({ ...form, medicalNotes: e.target.value })
                  }
                  placeholder="Indicaciones, medicación, contactos…"
                  className="w-full min-h-[90px] resize-y px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink leading-[1.5] outline-none"
                />
              </div>

              {error && (
                <p className="text-primary-dark text-[13.5px] mt-[14px]">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
