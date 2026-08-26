import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import { SunMark } from "../_components/SunMark";
import { ActivateAccountForm } from "./ActivateAccountForm";

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  let email = "";
  let childName = "";
  let roomName = "";
  let valid = false;

  if (code) {
    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from("invitations")
      .select(
        "email, status, expires_at, children (full_name, rooms (name))",
      )
      .eq("code", code)
      .maybeSingle();

    if (
      invitation &&
      invitation.status === "pending" &&
      new Date(invitation.expires_at) >= new Date()
    ) {
      valid = true;
      email = invitation.email;
      const child = invitation.children?.[0];
      childName = child?.full_name ?? "";
      roomName = child?.rooms?.[0]?.name ?? "";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg p-10">
      <div className="w-full max-w-[440px]">
        <div className="w-[58px] h-[58px] rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] flex items-center justify-center mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunMark size={30} />
        </div>

        {valid && code ? (
          <>
            <h1 className="font-display font-semibold text-[32px] leading-[1.15] m-[0_0_8px] text-ink">
              Bienvenida a OpenDayCare
            </h1>
            <p className="m-[0_0_26px] text-ink-muted text-[15.5px] leading-[1.55]">
              Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
              activar la cuenta.
            </p>
            <ActivateAccountForm
              code={code}
              email={email}
              childName={childName}
              roomName={roomName}
            />
            <p className="text-center mt-[22px] text-ink-muted text-[14.5px]">
              ¿Ya tenés cuenta?{" "}
              <Link
                href="/login"
                className="text-primary-dark font-extrabold"
              >
                Iniciar sesión
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display font-semibold text-[28px] leading-[1.15] m-[0_0_8px] text-ink">
              Invitación no válida
            </h1>
            <p className="m-[0_0_26px] text-ink-muted text-[15.5px] leading-[1.55]">
              Este link de invitación no es válido o ya fue usado.
            </p>
            <Link
              href="/login"
              className="block text-center w-full p-[15px] rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
