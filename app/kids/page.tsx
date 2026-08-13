import { Sidebar } from "../_components/Sidebar";
import { KidCard } from "../_components/KidCard";
import { AddKidModal } from "../_components/AddKidModal";

type KidBadge = { label: "MANÍ" | "LACTOSA" | "VINCULAR" };

type Kid = {
  slug: string;
  avatar: { letter: string; bg: string; color: string };
  name: string;
  age: string;
  linked: string;
  badge?: KidBadge;
};

const KIDS: Kid[] = [
  {
    slug: "mateo-fernandez",
    avatar: { letter: "M", bg: "#A9D9E8", color: "#1F7A93" },
    name: "Mateo Fernández",
    age: "3 años",
    linked: "2 padres vinculados",
    badge: { label: "MANÍ" },
  },
  {
    slug: "sofia-mendez",
    avatar: { letter: "S", bg: "#F4B8CC", color: "#C44A7A" },
    name: "Sofía Méndez",
    age: "2 años",
    linked: "1 padre vinculado",
  },
  {
    slug: "benjamin-ruiz",
    avatar: { letter: "B", bg: "#B9DEC4", color: "#3E8B62" },
    name: "Benjamín Ruiz",
    age: "3 años",
    linked: "2 padres vinculados",
  },
  {
    slug: "valentina-soto",
    avatar: { letter: "V", bg: "#F4DC8E", color: "#9A7B1E" },
    name: "Valentina Soto",
    age: "2 años",
    linked: "sin padres vinculados",
    badge: { label: "VINCULAR" },
  },
  {
    slug: "tomas-diaz",
    avatar: { letter: "T", bg: "#C9B6E8", color: "#7B5FC0" },
    name: "Tomás Díaz",
    age: "3 años",
    linked: "1 padre vinculado",
    badge: { label: "LACTOSA" },
  },
  {
    slug: "emma-castro",
    avatar: { letter: "E", bg: "#F4B8CC", color: "#C44A7A" },
    name: "Emma Castro",
    age: "2 años",
    linked: "1 padre vinculado",
  },
  {
    slug: "lucas-romero",
    avatar: { letter: "L", bg: "#A9D9E8", color: "#1F7A93" },
    name: "Lucas Romero",
    age: "3 años",
    linked: "1 padre vinculado",
  },
  {
    slug: "olivia-vega",
    avatar: { letter: "O", bg: "#B9DEC4", color: "#3E8B62" },
    name: "Olivia Vega",
    age: "2 años",
    linked: "1 padre vinculado",
  },
];

export default function KidsPage() {
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
            <AddKidModal />
          </div>

          <div className="flex items-center gap-[11px] bg-surface border border-border-cream rounded-[14px] px-4 py-3 mb-[22px]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B0A290"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Buscar niño…"
              className="flex-1 bg-transparent border-none text-[15px] text-ink outline-none placeholder:text-ink-placeholder"
            />
          </div>

          <div className="flex items-center gap-3 mb-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
              SALA SOLES
            </span>
            <span className="text-[13px] text-ink-faint">8 niños</span>
            <span className="flex-1 h-px bg-rule" />
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            {KIDS.map((kid) => (
              <KidCard key={kid.slug} kid={kid} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}