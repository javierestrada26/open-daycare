import Link from "next/link";
import type { ReactNode } from "react";

type SidebarActive = "feed" | "ninos" | "avisos" | "cuenta";

type NavItemProps = {
  label: string;
  href: string;
  active?: boolean;
  icon: ReactNode;
};

function NavItem({ label, href, active, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 px-3 py-[11px] rounded-[12px] text-[14.5px]",
        active
          ? "bg-surface-active text-primary font-extrabold"
          : "text-ink-soft font-semibold",
      ].join(" ")}
    >
      {icon}
      {label}
    </Link>
  );
}

type SidebarProps = {
  active?: SidebarActive;
};

export function Sidebar({ active = "feed" }: SidebarProps) {
  return (
    <aside className="w-[248px] shrink-0 bg-surface border-r border-border-cream flex flex-col sticky top-0 h-screen py-6 px-4">
      <a className="flex items-center gap-[11px] pt-1 pr-2 pb-[22px] pl-2">
        <span className="w-[38px] h-[38px] rounded-[12px] shrink-0 flex items-center justify-center bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </span>
        <span>
          <span className="block font-display font-semibold text-[17px] text-ink leading-none">
            OpenDayCare
          </span>
          <span className="block text-[11.5px] text-ink-faint mt-[2px]">
            Sala Soles
          </span>
        </span>
      </a>

      <a
        tabIndex={0}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-[14px] text-white font-extrabold text-[14.5px] mb-[18px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      <nav className="flex flex-col gap-1 flex-1">
        <NavItem
          href="/"
          active={active === "feed"}
          label="Feed"
          icon={
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
          }
        />
        <NavItem
          href="/kids"
          active={active === "ninos"}
          label="Niños"
          icon={
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="7" r="3" />
              <circle cx="17" cy="9" r="2.4" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
            </svg>
          }
        />
        <NavItem
          href="#"
          active={active === "avisos"}
          label="Avisos"
          icon={
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          }
        />
        <NavItem
          href="#"
          active={active === "cuenta"}
          label="Mi cuenta"
          icon={
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
      </nav>

      <div className="border-t border-border-cream pt-[14px] mt-2.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <span className="w-[38px] h-[38px] rounded-full bg-primary-soft text-white font-display font-semibold text-base flex items-center justify-center shrink-0">
            C
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-extrabold text-sm text-ink">
              Caro Giménez
            </span>
            <span className="block text-xs text-ink-faint">
              Maestra · Soles
            </span>
          </span>
          <a
            title="Cerrar sesión"
            tabIndex={0}
            className="shrink-0 w-8 h-8 rounded-[10px] bg-app-bg text-ink-muted flex items-center justify-center"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}