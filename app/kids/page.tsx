import { cookies } from "next/headers";
import { Sidebar } from "../_components/Sidebar";
import { AddKidModal } from "../_components/AddKidModal";
import { KidsBrowser } from "../_components/KidsBrowser";
import { createClient } from "@/utils/supabase/server";
import {
  allergyBadge,
  avatarForIndex,
  formatAgeYears,
  slugify,
  type KidCardVm,
  type RoomVm,
} from "../_lib/kids";

type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;
  allergy_tags: string[];
  medical_notes: string | null;
  room_id: string;
};

type RoomRow = {
  id: string;
  name: string;
  created_at: string;
};

export default async function KidsPage() {
  const supabase = createClient(await cookies());

  const [{ data: rooms }, { data: children }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, allergy_tags, medical_notes, room_id",
      )
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  const roomsVm: RoomVm[] = (rooms ?? []).map(
    (r: RoomRow): RoomVm => ({ id: r.id, name: r.name }),
  );

  const kidsVm: KidCardVm[] = (children ?? []).map(
    (c: ChildRow, i: number): KidCardVm => {
      const tags = c.allergy_tags ?? [];
      return {
        slug: slugify(c.full_name),
        avatar: {
          letter: c.full_name.charAt(0).toUpperCase(),
          ...avatarForIndex(i),
        },
        name: c.full_name,
        age: formatAgeYears(c.birth_date),
        linked: "sin padres vinculados",
        badge: { label: allergyBadge(tags) },
        roomId: c.room_id,
      };
    },
  );

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar active="ninos" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="flex items-end justify-between gap-4 mb-[22px]">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
                GESTIÓN
              </div>
              <h1 className="font-display font-semibold text-[30px] m-0 text-ink">
                Niños
              </h1>
            </div>
            <AddKidModal rooms={roomsVm} />
          </div>

          <KidsBrowser rooms={roomsVm} kids={kidsVm} />
        </div>
      </main>
    </div>
  );
}
