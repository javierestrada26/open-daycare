import Link from "next/link";

export type KidBadge = { label: "MANÍ" | "LACTOSA" | "VINCULAR" };

export type Kid = {
  slug: string;
  avatar: { letter: string; bg: string; color: string };
  name: string;
  age: string;
  linked: string;
  badge?: KidBadge;
};

const BADGE_STYLES: Record<KidBadge["label"], string> = {
  MANÍ: "bg-badge-mani-bg text-badge-mani",
  LACTOSA: "bg-badge-mani-bg text-badge-mani",
  VINCULAR: "bg-badge-vincular-bg text-badge-vincular",
};

function ChevronNeutral() {
  return (
    <svg
      className="shrink-0"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type KidCardProps = {
  kid: Kid;
};

export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="kid flex items-center gap-[14px] min-w-0 bg-surface border border-border-cream rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      <span
        className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-display font-semibold text-[19px]"
        style={{ background: kid.avatar.bg, color: kid.avatar.color }}
      >
        {kid.avatar.letter}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-display font-semibold text-base text-ink">
          {kid.name}
        </span>
        <span className="block text-[13px] text-ink-faint">
          {kid.age} · {kid.linked}
        </span>
      </span>
      {kid.badge ? (
        <span
          className={[
            "shrink-0 text-[11px] font-extrabold px-[9px] py-[5px] rounded-full",
            BADGE_STYLES[kid.badge.label],
          ].join(" ")}
        >
          {kid.badge.label}
        </span>
      ) : (
        <ChevronNeutral />
      )}
    </Link>
  );
}