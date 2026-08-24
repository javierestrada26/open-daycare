import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Sidebar } from "../../_components/Sidebar";
import { AllergyBox } from "../../_components/AllergyBox";
import { InfoRow } from "../../_components/InfoRow";
import { LinkParentModal } from "../../_components/LinkParentModal";
import { createClient } from "@/utils/supabase/server";
import {
  allergyLabel,
  avatarForIndex,
  formatAgeYears,
  formatBirthShort,
  formatEnrollShort,
  slugify,
  type RoomVm,
} from "../../_lib/kids";

type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergy_tags: string[];
  medical_notes: string | null;
  room_id: string;
};

type RoomRow = {
  id: string;
  name: string;
  created_at: string;
};

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient(await cookies());

  const [{ data: rooms }, { data: children }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("children")
      .select(
        "id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, room_id",
      )
      .eq("status", "active")
      .order("full_name", { ascending: true }),
  ]);

  const roomsVm: RoomVm[] = (rooms ?? []).map(
    (r: RoomRow): RoomVm => ({ id: r.id, name: r.name }),
  );

  const childRows: ChildRow[] = (children ?? []) as ChildRow[];
  const index = childRows.findIndex((c) => slugify(c.full_name) === slug);
  if (index === -1) {
    notFound();
  }
  const c = childRows[index];
  const room = roomsVm.find((r) => r.id === c.room_id);

  const avatar = {
    letter: c.full_name.charAt(0).toUpperCase(),
    ...avatarForIndex(index),
  };
  const ageRoom = `${formatAgeYears(c.birth_date)} · Sala ${
    room?.name ?? ""
  }`;

  const tags = c.allergy_tags ?? [];
  const notes = c.medical_notes?.trim() ?? "";
  const allergyParts: string[] = [];
  if (tags.length > 0) {
    allergyParts.push(tags.map(allergyLabel).join(", "));
  }
  if (notes.length > 0) {
    allergyParts.push(notes);
  }
  const allergyText =
    allergyParts.length > 0 ? allergyParts.join(". ") : null;

  const infoRows = [
    { label: "Fecha de nacimiento", value: formatBirthShort(c.birth_date) },
    { label: "Sala", value: room?.name ?? "" },
    { label: "Ingreso", value: formatEnrollShort(c.enrolled_at) },
  ];

  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar active="ninos" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[820px] w-full mx-auto px-10 pt-[34px] pb-20">
          <Link
            href="/kids"
            className="flex items-center gap-[7px] text-ink-muted font-bold text-sm mb-5"
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>

          <div className="flex gap-[26px] items-start flex-wrap">
            <div className="flex-1 min-w-[300px] flex flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <span
                  className="w-[84px] h-[84px] rounded-full shrink-0 flex items-center justify-center font-display font-semibold text-[34px]"
                  style={{ background: avatar.bg, color: avatar.color }}
                >
                  {avatar.letter}
                </span>
                <div className="flex-1">
                  <h1 className="font-display font-semibold text-[28px] m-0 text-ink">
                    {c.full_name}
                  </h1>
                  <p className="m-[3px_0_0] text-ink-muted text-[15px]">
                    {ageRoom}
                  </p>
                </div>
                <a
                  tabIndex={0}
                  className="border-[1.5px] border-border-cream bg-surface text-ink-soft font-bold text-sm px-4 py-[9px] rounded-xl"
                >
                  Editar
                </a>
              </div>

              {allergyText ? (
                <AllergyBox title="Alergias y notas" text={allergyText} />
              ) : null}

              <div className="bg-surface border border-border-cream rounded-2xl overflow-hidden">
                {infoRows.map((row, i) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={i === infoRows.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="w-[300px] shrink-0 flex flex-col gap-[14px]">
              <a
                tabIndex={0}
                className="flex items-center justify-center gap-[9px] w-full p-[13px] rounded-[14px] bg-ink text-white font-extrabold text-[15px]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
                Resumen del día
              </a>

              <div className="bg-surface border border-border-cream rounded-2xl p-[16px_18px]">
                <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-[14px]">
                  PADRES VINCULADOS
                </div>
                <div className="flex flex-col gap-[14px]">
                  <p className="text-[14px] text-ink-muted">
                    Aún no hay padres vinculados
                  </p>
                  <LinkParentModal kidName={c.full_name} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
