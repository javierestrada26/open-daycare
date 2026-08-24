"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { parseAllergyTags } from "../_lib/kids";

const BIRTHDATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseBirthDate(raw: string): Date | null {
  if (!BIRTHDATE_RE.test(raw)) return null;
  const [d, m, y] = raw.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export async function createKid(input: {
  fullName: string;
  birthDate: string;
  roomId: string;
  allergiesText: string;
  medicalNotes: string;
}): Promise<{ error?: string }> {
  const fullName = input.fullName.trim();
  const birth = parseBirthDate(input.birthDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (
    fullName.length === 0 ||
    birth === null ||
    birth.getTime() > today.getTime() ||
    !UUID_RE.test(input.roomId)
  ) {
    return { error: "Revisá el nombre y la fecha (dd/mm/aaaa)." };
  }

  const birthDate = `${birth.getFullYear()}-${String(
    birth.getMonth() + 1,
  ).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`;
  const allergyTags = parseAllergyTags(input.allergiesText);
  const medicalNotes =
    input.medicalNotes.trim().length > 0 ? input.medicalNotes.trim() : null;

  const supabase = createClient(await cookies());

  const { error } = await supabase.from("children").insert({
    room_id: input.roomId,
    full_name: fullName,
    birth_date: birthDate,
    medical_notes: medicalNotes,
    allergy_tags: allergyTags,
  });

  if (error) {
    return { error: "No se pudo guardar el niño. Intentá de nuevo." };
  }

  revalidatePath("/kids", "layout");
  return {};
}
