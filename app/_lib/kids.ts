export type RoomVm = {
  id: string;
  name: string;
};

export type ChildVm = {
  id: string;
  fullName: string;
  birthDate: string;
  enrolledAt: string;
  medicalNotes: string | null;
  allergyTags: string[];
  roomId: string;
};

export type KidBadgeLabel = "MANÍ" | "LACTOSA" | "VINCULAR";

export type KidCardVm = {
  slug: string;
  avatar: { letter: string; bg: string; color: string };
  name: string;
  age: string;
  linked: string;
  badge?: { label: KidBadgeLabel };
  roomId: string;
};

export function slugify(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatAgeYears(iso: string): string {
  const [by, bm, bd] = iso.split("-").map(Number);
  if (
    Number.isNaN(by) ||
    Number.isNaN(bm) ||
    Number.isNaN(bd) ||
    by === 0 ||
    bm === 0 ||
    bd === 0
  ) {
    return "";
  }
  const today = new Date();
  let years = today.getFullYear() - by;
  const monthDiff = today.getMonth() - (bm - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd)) {
    years--;
  }
  if (years < 0) years = 0;
  return years < 2 ? `${years} año` : `${years} años`;
}

const birthFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatBirthShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return "";
  return birthFormatter.format(new Date(y, m - 1, d)).replace(/\./g, "");
}

const enrollFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "short",
  year: "numeric",
});

export function formatEnrollShort(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m)) return "";
  return enrollFormatter.format(new Date(y, m - 1, 1)).replace(/\./g, "");
}

const AVATAR_PALETTE: { bg: string; color: string }[] = [
  { bg: "var(--color-avatar-sky-bg)", color: "var(--color-avatar-sky)" },
  { bg: "var(--color-avatar-pink-bg)", color: "var(--color-avatar-pink)" },
  { bg: "var(--color-avatar-green-bg)", color: "var(--color-avatar-green)" },
  {
    bg: "var(--color-avatar-yellow-bg)",
    color: "var(--color-avatar-yellow)",
  },
  {
    bg: "var(--color-avatar-purple-bg)",
    color: "var(--color-avatar-purple)",
  },
];

export function avatarForIndex(i: number): { bg: string; color: string } {
  const len = AVATAR_PALETTE.length;
  return AVATAR_PALETTE[((i % len) + len) % len];
}

const ALLERGY_ES_TO_EN: Record<string, string> = {
  maní: "peanut",
  mani: "peanut",
  lactosa: "lactose",
  glúten: "gluten",
  gluten: "gluten",
  huevo: "egg",
};

export function parseAllergyTags(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .map((t) => ALLERGY_ES_TO_EN[t] ?? t);
}

export function allergyBadge(tags: string[]): KidBadgeLabel {
  for (const tag of tags) {
    if (tag === "peanut") return "MANÍ";
    if (tag === "lactose") return "LACTOSA";
  }
  return "VINCULAR";
}

const ALLERGY_EN_TO_ES: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
};

export function allergyLabel(tag: string): string {
  return ALLERGY_EN_TO_ES[tag] ?? tag.toUpperCase();
}
