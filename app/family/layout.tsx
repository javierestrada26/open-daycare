import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) {
    redirect("/login");
  }

  if (userData.role === "staff" || userData.role === "admin") {
    redirect("/staff");
  }

  if (userData.role !== "parent") {
    redirect("/staff");
  }

  return (
    <>
      {children}
    </>
  );
}
