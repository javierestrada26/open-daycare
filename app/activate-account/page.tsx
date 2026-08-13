"use client";

import { useState } from "react";
import Link from "next/link";
import { SunMark } from "../_components/SunMark";

const invitation = { child: "Mateo", room: "Soles", avatarLetter: "M" };

export default function ActivateAccountPage() {
  const [code, setCode] = useState("7K4P9");
  const [email, setEmail] = useState("lucia.fernandez@gmail.com");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        <div className="w-[58px] h-[58px] rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunMark size={30} />
        </div>

        <h1 className="font-display font-semibold text-[32px] leading-[1.15] m-[0_0_8px] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="m-[0_0_26px] text-ink-muted text-[15.5px] leading-[1.55]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <div className="flex items-center gap-[14px] bg-white border-[1.5px] border-border-input rounded-[16px] px-[16px] py-[14px] mb-[22px]">
          <span className="w-[44px] h-[44px] rounded-full bg-avatar-sky-bg text-avatar-sky font-display font-semibold text-[19px] flex items-center justify-center">
            {invitation.avatarLetter}
          </span>
          <div>
            <div className="text-[13px] text-ink-muted">
              Te invitaron a seguir a
            </div>
            <div className="font-display font-semibold text-[17px] text-ink">
              {invitation.child} · Sala {invitation.room}
            </div>
          </div>
        </div>

        <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-white text-[18px] tracking-[3px] font-bold text-ink mb-[18px] font-display"
        />

        <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
          EMAIL
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-white text-[15px] text-ink mb-[18px]"
        />

        <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
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
              consent ? "bg-consent-check" : "bg-white border-[1.5px] border-border-input",
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
          type="button"
          className="block text-center w-full p-[15px] rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </button>

        <p className="text-center mt-[22px] text-ink-muted text-[14.5px]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary-dark font-extrabold">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}