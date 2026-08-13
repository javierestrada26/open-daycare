import { Sidebar } from "./_components/Sidebar";
import { QuickComposer } from "./_components/QuickComposer";
import { FeedPost, type FeedPostProps } from "./_components/FeedPost";

const posts: FeedPostProps[] = [
  {
    avatar: { letter: "M", bg: "#A9D9E8", color: "#1F7A93" },
    name: "Mateo",
    time: "14:20",
    badge: { kind: "logro", label: "LOGRO" },
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    avatar: { letter: "M", bg: "#A9D9E8", color: "#1F7A93" },
    name: "Mateo",
    time: "09:40",
    badge: { kind: "actividad", label: "ACTIVIDAD" },
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: { type: "placeholder", caption: "Foto · pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    avatar: { letter: "", bg: "#CCD8F4", color: "#4E72C8" },
    name: "Anuncio general",
    time: "07:50",
    badge: { kind: "anuncio", label: "ANUNCIO" },
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
    avatarIcon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar active="feed" />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-[34px] pb-20">
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-primary mb-1">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="font-display font-semibold text-[30px] m-0 text-ink">
              Buenas, Caro
            </h1>
            <p className="m-[5px_0_0] text-ink-muted text-[14.5px]">
              12 niños · martes 17 jun
            </p>
          </div>

          <QuickComposer />

          <div className="flex items-center gap-[14px] mb-[14px]">
            <span
              className="text-[12.5px] font-extrabold tracking-[0.8px]"
              style={{ color: "#8A7C6D" }}
            >
              PUBLICADO HOY
            </span>
            <span className="flex-1 h-px bg-rule" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post, i) => (
              <FeedPost key={i} {...post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}