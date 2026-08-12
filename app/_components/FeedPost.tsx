import type { ReactNode } from "react";

export type BadgeKind = "logro" | "actividad" | "anuncio";

export type FeedPostProps = {
  avatar: { letter: string; bg: string; color: string };
  name: string;
  time: string;
  badge: { kind: BadgeKind; label: string };
  audience: string;
  text: string;
  photo?:
    | { type: "placeholder"; caption: string }
    | { type: "image"; src: string; alt: string };
  likes: number;
  comments: number;
  avatarIcon?: ReactNode;
};

const BADGE_STYLES: Record<
  BadgeKind,
  { bg: string; color: string; className?: string }
> = {
  logro: {
    bg: "#CFEBD8",
    color: "#3E9B6C",
  },
  actividad: {
    bg: "#C7E7F1",
    color: "#2E89A6",
  },
  anuncio: {
    bg: "#CCD8F4",
    color: "#4E72C8",
  },
};

const HeartIcon = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="#E0654A"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const CommentIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </svg>
);

export function FeedPost({
  avatar,
  name,
  time,
  badge,
  audience,
  text,
  photo,
  likes,
  comments,
  avatarIcon,
}: FeedPostProps) {
  const badgeStyle = BADGE_STYLES[badge.kind];

  return (
    <article className="bg-surface border border-border-cream rounded-[20px] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <header className="flex items-center gap-3 mb-[14px]">
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-display font-semibold text-[17px]"
          style={{ background: avatar.bg, color: avatar.color }}
        >
          {avatarIcon ?? avatar.letter}
        </span>
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-ink">
            {name}
          </div>
          <div className="text-[12.5px] text-ink-faint">
            {time} · publicado por vos
          </div>
        </div>
        <div
          className="flex items-center gap-[7px] px-3 py-1.5 rounded-full"
          style={{ background: badgeStyle.bg }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: badgeStyle.color }}
          />
          <span
            className="text-xs font-extrabold tracking-[0.5px]"
            style={{ color: badgeStyle.color }}
          >
            {badge.label}
          </span>
        </div>
      </header>

      <div className="text-[12.5px] text-ink-faint mb-2.5">Para: {audience}</div>

      <p className="text-[15.5px] leading-[1.55] text-ink-body m-0">{text}</p>

      {photo?.type === "placeholder" ? (
        <a
          tabIndex={0}
          className="flex flex-col items-center justify-center gap-2 mt-[14px] border-[1.5px] border-dashed rounded-[16px] bg-[#F4ECE1] h-[200px] text-ink-placeholder"
          style={{ borderColor: "#DBCDBA" }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
          </svg>
          <span className="text-[13.5px]">{photo.caption}</span>
        </a>
      ) : null}

      <footer className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-divider">
        <span className="flex items-center gap-[7px] text-primary-accent font-bold text-sm">
          <HeartIcon />
          {likes}
        </span>
        <a
          tabIndex={0}
          className="flex items-center gap-[7px] text-ink-muted font-bold text-sm"
        >
          <CommentIcon />
          {comments}
        </a>
        <span className="flex-1" />
        <a
          tabIndex={0}
          className="text-primary-dark font-extrabold text-sm"
        >
          Editar
        </a>
      </footer>
    </article>
  );
}