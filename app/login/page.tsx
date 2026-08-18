"use client";

import { useState } from "react";
import Link from "next/link";
import { SunMark } from "../_components/SunMark";
import { signIn } from "@/app/_actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await signIn(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-[1.05fr_1fr] bg-auth-bg">
      <div className="relative overflow-hidden flex flex-col justify-between px-[60px] py-[56px] text-white bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)]">
        <div className="absolute w-[420px] h-[420px] rounded-full bg-[rgba(255,255,255,0.12)] -top-[140px] -right-[120px]" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[rgba(255,255,255,0.10)] -bottom-[110px] -left-[80px]" />

        <div className="relative flex items-center gap-[13px]">
          <span className="w-[46px] h-[46px] rounded-[14px] bg-[rgba(255,255,255,0.22)] flex items-center justify-center">
            <SunMark size={26} />
          </span>
          <span className="font-display font-semibold text-[21px] tracking-[0.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="font-display font-semibold text-[42px] leading-[1.12] m-[0_0_18px]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="text-[17px] leading-[1.6] m-0 max-w-[430px] text-[rgba(255,255,255,0.92)]">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-[rgba(255,255,255,0.9)]">
          🌿 Guardería Sala Soles
        </div>
      </div>

      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="font-display font-semibold text-[30px] m-[0_0_6px] text-ink">
            Iniciar sesión
          </h2>
          <p className="m-[0_0_28px] text-ink-muted text-[15px]">
            Ingresá para ver el día de hoy.
          </p>

          <form action={onSubmit}>
            <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
              EMAIL
            </div>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-white text-[15px] text-ink mb-[18px]"
            />

            <div className="text-[12px] font-bold tracking-[0.7px] text-ink-muted mb-[8px]">
              CONTRASEÑA
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-border-input bg-white text-[15px] text-ink mb-[10px]"
            />

            <div className="text-right mb-[20px]">
              <button
                type="button"
                className="text-primary-dark text-[13.5px] font-bold cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="block text-center w-full p-[15px] rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] cursor-pointer shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>

            {error && (
              <p className="text-primary-dark text-[13.5px] mt-[10px]">{error}</p>
            )}
          </form>

          <p className="text-center mt-[24px] text-ink-muted text-[14.5px]">
            ¿Te invitó la guardería?{" "}
            <Link
              href="/activate-account"
              className="text-primary-dark font-extrabold"
            >
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
