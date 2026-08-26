"use client";

import { memo, useState, type ReactNode } from "react";
import Image from "next/image";

export type BadgeKind = "comida" | "siesta" | "actividad" | "logro" | "animo" | "foto" | "anuncio";

export type FeedPostProps = {
  avatar: { letter: string; bg: string; color: string };
  name: string;
  time: string;
  badge: { kind: BadgeKind; label: string };
  audience: string;
  text: string;
  photos?: Array<{ url: string; alt: string }>;
  postId?: string;
  likes?: number;
  comments?: number;
  avatarIcon?: ReactNode;
};

const BADGE_STYLES: Record<
  BadgeKind,
  { bg: string; color: string; className?: string }
> = {
  comida: {
    bg: "#F5E6D3",
    color: "#C4884F",
  },
  siesta: {
    bg: "#E8E0F0",
    color: "#8B6BAE",
  },
  actividad: {
    bg: "#C7E7F1",
    color: "#2E89A6",
  },
  logro: {
    bg: "#CFEBD8",
    color: "#3E9B6C",
  },
  animo: {
    bg: "#FFF3CD",
    color: "#D4A017",
  },
  foto: {
    bg: "#E8F4F8",
    color: "#5B9BD5",
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

function PhotoGallery({ photos }: { photos: Array<{ url: string; alt: string }> }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="mt-[14px] w-full rounded-[16px] overflow-hidden cursor-pointer border-none p-0 bg-transparent"
        >
          <Image
            src={photos[0].url}
            alt={photos[0].alt}
            width={600}
            height={300}
            className="w-full object-cover max-h-[300px]"
          />
        </button>
        {lightboxOpen && (
          <Lightbox
            photos={photos}
            currentIndex={currentIndex}
            onClose={closeLightbox}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
      </>
    );
  }

  const displayPhotos = photos.slice(0, 4);
  const remaining = photos.length - 4;

  return (
    <>
      <div className="mt-[14px] grid grid-cols-2 gap-2 rounded-[16px] overflow-hidden">
        {displayPhotos.map((photo, index) => (
          <button
            key={index}
            type="button"
            onClick={() => openLightbox(index)}
            className="relative aspect-square cursor-pointer border-none p-0 bg-transparent overflow-hidden"
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              className="object-cover"
            />
            {index === 3 && remaining > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold text-lg">
                +{remaining} más
              </div>
            )}
          </button>
        ))}
      </div>
      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: {
  photos: Array<{ url: string; alt: string }>;
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") onPrevious();
        if (e.key === "ArrowRight") onNext();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de fotos"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 bg-transparent border-none cursor-pointer z-10"
        aria-label="Cerrar"
      >
        ×
      </button>
      
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-gray-300 bg-transparent border-none cursor-pointer z-10"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl font-bold hover:text-gray-300 bg-transparent border-none cursor-pointer z-10"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}

      <div
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photos[currentIndex].url}
          alt={photos[currentIndex].alt}
          width={800}
          height={600}
          className="max-w-[90vw] max-h-[90vh] object-contain"
        />
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-3 py-1 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  );
}

export const FeedPost = memo(function FeedPost({
  avatar,
  name,
  time,
  badge,
  audience,
  text,
  photos,
  likes = 0,
  comments = 0,
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

      {photos && photos.length > 0 && <PhotoGallery photos={photos} />}

      <footer className="flex items-center gap-[18px] mt-4 pt-[14px] border-t border-divider">
        <span className="flex items-center gap-[7px] text-primary-accent font-bold text-sm">
          <HeartIcon />
          {likes}
        </span>
        <button
          type="button"
          className="flex items-center gap-[7px] text-ink-muted font-bold text-sm cursor-pointer bg-transparent border-none p-0"
        >
          <CommentIcon />
          {comments}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          className="text-primary-dark font-extrabold text-sm cursor-pointer bg-transparent border-none p-0"
        >
          Editar
        </button>
      </footer>
    </article>
  );
});