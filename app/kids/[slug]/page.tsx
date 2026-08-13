import Link from "next/link";
import { Sidebar } from "../../../_components/Sidebar";
import { AllergyBox } from "../../../_components/AllergyBox";
import { InfoRow } from "../../../_components/InfoRow";
import { LinkedParent } from "../../../_components/LinkedParent";

type ParentStatus = "activa" | "pendiente";

type Parent = {
  avatar: { letter: string; bg: string };
  name: string;
  relation: string;
  statusLabel: string;
  status: ParentStatus;
};

type KidProfile = {
  avatar: { letter: string; bg: string; color: string };
  name: string;
  ageRoom: string;
  allergy: { title: string; text: string };
  infoRows: { label: string; value: string }[];
  parents: Parent[];
};

const MATEO: KidProfile = {
  avatar: { letter: "M", bg: "#A9D9E8", color: "#1F7A93" },
  name: "Mateo Fernández",
  ageRoom: "3 años · Sala Soles",
  allergy: {
    title: "Alergias y notas",
    text: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
  },
  infoRows: [
    { label: "Fecha de nacimiento", value: "12 mar 2022" },
    { label: "Sala", value: "Soles" },
    { label: "Ingreso", value: "feb 2025" },
  ],
  parents: [
    {
      avatar: { letter: "L", bg: "#C9B6E8" },
      name: "Lucía Fernández",
      relation: "Mamá · activa",
      statusLabel: "ACTIVA",
      status: "activa",
    },
    {
      avatar: { letter: "D", bg: "#A9C7E8" },
      name: "Diego Fernández",
      relation: "Papá · invitación enviada",
      statusLabel: "PENDIENTE",
      status: "pendiente",
    },
  ],
};

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  const kid = MATEO;

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
                  style={{ background: kid.avatar.bg, color: kid.avatar.color }}
                >
                  {kid.avatar.letter}
                </span>
                <div className="flex-1">
                  <h1 className="font-display font-semibold text-[28px] m-0 text-ink">
                    {kid.name}
                  </h1>
                  <p className="m-[3px_0_0] text-ink-muted text-[15px]">
                    {kid.ageRoom}
                  </p>
                </div>
                <a
                  tabIndex={0}
                  className="border-[1.5px] border-border-cream bg-surface text-ink-soft font-bold text-sm px-4 py-[9px] rounded-xl"
                >
                  Editar
                </a>
              </div>

              <AllergyBox title={kid.allergy.title} text={kid.allergy.text} />

              <div className="bg-surface border border-border-cream rounded-2xl overflow-hidden">
                {kid.infoRows.map((row, i) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={i === kid.infoRows.length - 1}
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
                  {kid.parents.map((parent) => (
                    <LinkedParent key={parent.name} {...parent} />
                  ))}
                  <LinkedParent addNew label="Vincular otro padre" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}