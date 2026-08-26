"use client";

import { useState } from "react";
import { activateAccount } from "../_actions/invitations";

type ActivateAccountFormProps = {
  code: string;
  email: string;
  childName: string;
  roomName: string;
};

export function ActivateAccountForm({
  code,
  email,
  childName,
  roomName,
}: ActivateAccountFormProps) {
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarLetter = childName.charAt(0).toUpperCase();

  async function onSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await activateAccount({
      code: String(formData.get("code")),
      password: String(formData.get("password")),
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={onSubmit}>
      <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-border-input rounded-[16px] px-[16px] py-[14px] mb-[22px]">
        <span className="w-[44px] h-[44px] rounded-full bg-avatar-sky-bg text-avatar-sky font-display font-semibold text-[19px] flex items-center justify-center">
          {avatarLetter}
        </span>
        <div>
          <div className="text-[13px] text-ink-muted">
            Te invitaron a seguir a
          </div>
          <div className="font-display font-semibold text-[17px] text-ink">
            {childName} · Sala {roomName}
          </div>
        </div>
      </div>

      <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        name="code"
        value={code}
        readOnly
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-divider text-[18px] tracking-[3px] font-bold text-ink mb-[18px] font-display cursor-default"
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
        EMAIL
      </div>
      <input
        type="email"
        value={email}
        readOnly
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-divider text-[15px] text-ink mb-[18px] cursor-default"
      />

      <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-white text-[15px] text-ink mb-[18px]"
      />

      <button
        type="button"
        onClick={() => setConsent((c) => !c)}
        className="flex items-start gap-3 bg-consent-bg rounded-[14px] px-[16px] py-[14px] mb-[24px] cursor-pointer text-left w-full"
      >
        <span
          className={[
            "shrink-0 w-6 h-6 rounded-[8px] flex items-center justify-center mt-px",
            consent
              ? "bg-consent-check"
              : "bg-white border-[1.5px] border-border-input",
          ].join(" ")}
        >
          {consent && (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="text-[14px] text-consent-text leading-[1.45]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
          de la app.
        </span>
      </button>

      <button
        type="submit"
        disabled={loading}
        className="block text-center w-full p-[15px] rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        {loading ? "Activando…" : "Activar mi cuenta"}
      </button>

      {error && (
        <p className="text-primary-dark text-[13.5px] mt-[10px]">{error}</p>
      )}
    </form>
  );
}
