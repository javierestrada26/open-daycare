"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signIn(formData: FormData): Promise<{ error?: string } | void> {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  if (data.user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (userData?.role === "parent") {
      redirect("/family");
    }

    if (userData?.role === "staff" || userData?.role === "admin") {
      redirect("/staff");
    }
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  redirect("/login");
}
