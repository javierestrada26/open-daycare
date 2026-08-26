"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";
import {
  buildInvitationEmail,
  generateInvitationCode,
  INVITATION_TTL_DAYS,
  RELATION_TO_DB,
} from "../_lib/invitations";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_CODE_ATTEMPTS = 5;

export async function sendInvitation(input: {
  childId: string;
  fullName: string;
  email: string;
  relationship: string;
}): Promise<{ code?: string; error?: string }> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (
    fullName.length === 0 ||
    !EMAIL_RE.test(email) ||
    !UUID_RE.test(input.childId) ||
    !(input.relationship in RELATION_TO_DB)
  ) {
    return { error: "Revisá los datos ingresados." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No se pudo enviar la invitación. Intentá de nuevo." };
  }

  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", input.childId)
    .single();

  if (!child) {
    return { error: "No se encontró al niño." };
  }

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("child_id", input.childId)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "Ya hay una invitación pendiente para este email." };
  }

  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const relationship = RELATION_TO_DB[
    input.relationship as keyof typeof RELATION_TO_DB
  ];

  let code = "";
  let inserted = false;

  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    code = generateInvitationCode();
    const { error } = await supabase.from("invitations").insert({
      child_id: input.childId,
      invited_by: user.id,
      full_name: fullName,
      email,
      relationship,
      code,
      expires_at: expiresAt.toISOString(),
    });
    if (!error) {
      inserted = true;
      break;
    }
    if (error.code !== "23505") break;
  }

  if (!inserted) {
    return { error: "No se pudo crear la invitación. Intentá de nuevo." };
  }

  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate-account?code=${code}`;
  const { subject, html } = buildInvitationEmail({
    parentName: fullName,
    childName: child.full_name,
    code,
    activationUrl,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);

  let sendFailed = false;
  try {
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: [email],
      subject,
      html,
    });
    if (sendError) sendFailed = true;
  } catch {
    sendFailed = true;
  }

  if (sendFailed) {
    await createAdminClient().from("invitations").delete().eq("code", code);
    return { error: "No se pudo enviar el email. Intentá de nuevo." };
  }

  return { code };
}

export async function activateAccount(input: {
  code: string;
  password: string;
}): Promise<{ error?: string } | void> {
  const code = input.code.trim();
  const password = input.password;

  if (code.length === 0 || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select(
      "id, child_id, full_name, email, relationship, status, expires_at, children (full_name, rooms (id, name, daycare_id))",
    )
    .eq("code", code)
    .maybeSingle();

  if (!invitation || invitation.status !== "pending") {
    return { error: "Este link de invitación no es válido o ya fue usado." };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await admin
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "Este link de invitación no es válido o ya fue usado." };
  }

  const child = invitation.children?.[0];
  const room = child?.rooms?.[0];
  const daycareId = room?.daycare_id;

  if (!daycareId) {
    return { error: "No se pudo activar la cuenta. Intentá de nuevo." };
  }

  const { data: authUser, error: createError } =
    await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        daycare_id: daycareId,
        role: "parent",
        full_name: invitation.full_name,
      },
    });

  if (createError) {
    const msg = (createError as { message?: string }).message ?? "";
    if (msg.toLowerCase().includes("already")) {
      return { error: "Ya existe una cuenta con este email." };
    }
    return { error: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  const { error: linkError } = await admin.from("parent_children").insert({
    parent_id: authUser.user!.id,
    child_id: invitation.child_id,
    relationship: invitation.relationship,
  });

  if (linkError) {
    await admin.auth.admin.deleteUser(authUser.user!.id);
    return { error: "No se pudo vincular la cuenta. Intentá de nuevo." };
  }

  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });

  if (signInError) {
    redirect("/login");
  }

  redirect("/");
}
