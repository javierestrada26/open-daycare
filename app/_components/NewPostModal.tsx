"use client";

import { useCallback, useEffect, useState } from "react";

type Recipient = "Mateo" | "Sofía" | "Benjamín" | "Toda la sala";

type Tipo = "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio";

type FormState = {
  recipient: Recipient;
  tipo: Tipo;
  descripcion: string;
};

const EMPTY_FORM: FormState = {
  recipient: "Mateo",
  tipo: "Actividad",
  descripcion: "",
};

type Avatar = { letter: string; bgVar: string; colorVar: string };

const RECIPIENTS: { id: Recipient; label: string; avatar?: Avatar }[] = [
  { id: "Mateo", label: "Mateo", avatar: { letter: "M", bgVar: "var(--color-avatar-sky-bg)", colorVar: "var(--color-avatar-sky)" } },
  { id: "Sofía", label: "Sofía", avatar: { letter: "S", bgVar: "var(--color-avatar-pink-bg)", colorVar: "var(--color-avatar-pink)" } },
  { id: "Benjamín", label: "Benjamín", avatar: { letter: "B", bgVar: "var(--color-avatar-green-bg)", colorVar: "var(--color-avatar-green)" } },
  { id: "Toda la sala", label: "Toda la sala" },
];

const TIPOS: { id: Tipo; label: string; bg: string; color: string }[] = [
  { id: "Comida", label: "Comida", bg: "var(--color-tipo-comida)", color: "#fff" },
  { id: "Siesta", label: "Siesta", bg: "var(--color-tipo-siesta-bg)", color: "var(--color-tipo-siesta)" },
  { id: "Actividad", label: "Actividad", bg: "var(--color-badge-actividad)", color: "#fff" },
  { id: "Logro", label: "Logro", bg: "var(--color-badge-logro-bg)", color: "var(--color-badge-logro)" },
  { id: "Ánimo", label: "Ánimo", bg: "var(--color-tipo-animo-bg)", color: "var(--color-tipo-animo)" },
  { id: "Foto", label: "Foto", bg: "var(--color-tipo-foto-bg)", color: "var(--color-tipo-foto)" },
  { id: "Anuncio", label: "Anuncio", bg: "var(--color-badge-anuncio-bg)", color: "var(--color-badge-anuncio)" },
];

export function NewPostModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const close = useCallback(() => {
    setOpen(false);
    setForm(EMPTY_FORM);
  }, []);

  // ESC closes the modal while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-[14px] text-white font-extrabold text-[14.5px] mb-[18px] bg-[linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
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
        Nueva publicación
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]"
          style={{ background: "var(--color-modal-overlay)" }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[580px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
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
                Nueva publicación
              </span>
              <button
                type="button"
                onClick={close}
                className="text-primary text-[15px] font-extrabold"
              >
                Publicar
              </button>
            </div>

            <div className="px-[26px] py-6">
              <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                PARA
              </div>
              <div className="flex flex-wrap gap-[9px] mb-[22px]">
                {RECIPIENTS.map(({ id, label, avatar }) => {
                  const active = form.recipient === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm({ ...form, recipient: id })}
                      className={[
                        "flex items-center gap-2 rounded-full border-[1.5px] border-solid font-bold text-[14px]",
                        avatar ? "py-[6px] pr-[14px] pl-[6px]" : "py-[6px] px-[16px]",
                        active
                          ? "border-ink bg-ink text-white"
                          : "border-border-cream bg-surface text-ink-soft",
                      ].join(" ")}
                    >
                      {avatar && (
                        <span
                          className="w-[26px] h-[26px] rounded-full font-display font-semibold text-[13px] flex items-center justify-center"
                          style={{ background: avatar.bgVar, color: avatar.colorVar }}
                        >
                          {avatar.letter}
                        </span>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                TIPO
              </div>
              <div className="flex flex-wrap gap-[9px] mb-[22px]">
                {TIPOS.map(({ id, label, bg, color }) => {
                  const active = form.tipo === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: id })}
                      className={[
                        "py-[8px] px-[16px] rounded-full border-none font-extrabold text-[13.5px]",
                        active ? "outline outline-2 outline-offset-[3px] outline-ink" : "",
                      ].join(" ")}
                      style={{ background: bg, color }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                DESCRIPCIÓN
              </div>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Contá cómo le fue hoy…"
                className="w-full min-h-[120px] resize-y px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink leading-[1.5] outline-none mb-[22px]"
              />

              <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]">
                FOTOS
              </div>
              <div className="flex gap-[12px]">
                <div className="w-[96px] h-[96px] bg-photo-tile-bg border border-border-cream rounded-[14px] flex items-center justify-center text-photo-tile-icon">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
                  </svg>
                </div>
                <div className="w-[96px] h-[96px] bg-photo-tile-bg border-[1.5px] border-dashed border-photo-add-border rounded-[14px] flex flex-col items-center justify-center gap-[6px] text-ink-placeholder">
                  <svg
                    className="text-primary-dark"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[12px]">Agregar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
