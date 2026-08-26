"use client";

import { useCallback, useEffect, useState } from "react";
import { sendInvitation } from "../_actions/invitations";
import type { RelationUi } from "../_lib/invitations";

type FormState = {
  name: string;
  email: string;
  relation: RelationUi;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  relation: "Mamá",
};

const RELATIONS: RelationUi[] = ["Mamá", "Papá", "Tutor/a"];

type SendState = "idle" | "sending" | "success" | "error";

type LinkParentModalProps = {
  kidName: string;
  childId: string;
};

export function LinkParentModal({ kidName, childId }: LinkParentModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sentCode, setSentCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    setForm(EMPTY_FORM);
    setSendState("idle");
    setSentCode("");
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const firstName = kidName.split(" ")[0];

  async function handleSubmit() {
    setSendState("sending");
    setErrorMessage("");
    const result = await sendInvitation({
      childId,
      fullName: form.name,
      email: form.email,
      relationship: form.relation,
    });
    if (result.code) {
      setSentCode(result.code);
      setSendState("success");
    } else {
      setErrorMessage(result.error ?? "Algo salió mal.");
      setSendState("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 pt-2"
      >
        <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center shrink-0 text-ink-placeholder">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="font-extrabold text-[14.5px] text-primary-dark">
          Vincular otro padre
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]"
          style={{ background: "var(--color-modal-overlay)" }}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-[26px] py-5 border-b border-border-cream">
              <div>
                <div className="font-display text-[18px] font-semibold text-ink">
                  Vincular padre
                </div>
                <div className="text-[13px] text-ink-faint">a {kidName}</div>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-[34px] h-[34px] rounded-[10px] bg-divider flex items-center justify-center text-ink-muted"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-[26px] py-[22px]">
              {sendState === "success" ? (
                <>
                  <div className="bg-consent-bg border-[1.5px] border-dashed border-consent-border rounded-[16px] p-[18px] text-center mb-5">
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-consent-label mb-2">
                      CÓDIGO DE INVITACIÓN
                    </div>
                    <div className="font-display font-semibold text-[34px] tracking-[7px] text-consent-text">
                      {sentCode}
                    </div>
                    <div className="text-[13px] text-consent-label mt-[6px]">
                      Vence en 7 días
                    </div>
                  </div>
                  <div className="text-center mb-5">
                    <p className="text-[14px] text-ink-soft">
                      Enviamos la invitación a{" "}
                      <strong className="text-ink">{form.email}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="flex items-center justify-center gap-[9px] w-full p-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
                    style={{
                      background:
                        "linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))",
                      boxShadow: "0 10px 22px -8px rgba(238,129,100,0.7)",
                    }}
                  >
                    Listo
                  </button>
                </>
              ) : (
                <>
                  <div className="flex gap-[11px] bg-info-banner-bg rounded-[14px] p-[13px_16px] mb-5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-badge-anuncio shrink-0 mt-px"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span className="text-info-banner-text text-[13.5px] leading-[1.45]">
                      Le enviaremos un correo con un código para que active su
                      cuenta. Solo verá el feed de {firstName}.
                    </span>
                  </div>

                  <div className="mb-[18px]">
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                      NOMBRE DEL PADRE/MADRE
                    </div>
                    <input
                      autoFocus
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Ej. Diego Fernández"
                      className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink outline-none"
                    />
                  </div>

                  <div className="mb-[18px]">
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                      EMAIL
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="correo@ejemplo.com"
                      className="w-full px-[16px] py-[13px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink outline-none"
                    />
                  </div>

                  <div className="mb-5">
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-2">
                      PARENTESCO
                    </div>
                    <div className="flex gap-[9px]">
                      {RELATIONS.map((r) => {
                        const active = form.relation === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() =>
                              setForm({ ...form, relation: r })
                            }
                            className={[
                              "flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px]",
                              active
                                ? "bg-badge-anuncio-bg border-pill-active-border text-badge-anuncio"
                                : "bg-surface border-border-cream text-ink-soft",
                            ].join(" ")}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-consent-bg border-[1.5px] border-dashed border-consent-border rounded-[16px] p-[18px] text-center mb-5">
                    <div className="text-[12px] font-extrabold tracking-[0.7px] text-consent-label mb-2">
                      CÓDIGO DE INVITACIÓN
                    </div>
                    <div className="font-display font-semibold text-[14px] text-consent-text">
                      Se genera al enviar la invitación
                    </div>
                    <div className="text-[13px] text-consent-label mt-[6px]">
                      Vence en 7 días
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={sendState === "sending"}
                    className="flex items-center justify-center gap-[9px] w-full p-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]"
                    style={{
                      background:
                        "linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))",
                      boxShadow: "0 10px 22px -8px rgba(238,129,100,0.7)",
                    }}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 2-7 20-4-9-9-4z" />
                      <path d="M22 2 11 13" />
                    </svg>
                    {sendState === "sending" ? "Enviando…" : "Enviar invitación"}
                  </button>
                  {sendState === "error" && errorMessage && (
                    <p className="text-[13.5px] text-primary-dark mt-[10px] text-center">
                      {errorMessage}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
