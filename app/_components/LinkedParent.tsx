type ParentStatus = "activa" | "pendiente";

type ParentData = {
  avatar: { letter: string; bg: string };
  name: string;
  relation: string;
  statusLabel: string;
  status: ParentStatus;
};

type AddNewData = {
  addNew: true;
  label: string;
};

type LinkedParentProps = ParentData | AddNewData;

const STATUS_BADGE: Record<ParentStatus, string> = {
  activa: "bg-badge-activa-bg text-badge-activa",
  pendiente: "bg-badge-pendiente-bg text-badge-pendiente",
};

export function LinkedParent(props: LinkedParentProps) {
  if ("addNew" in props && props.addNew) {
    return (
      <a className="flex items-center gap-3 pt-2">
        <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center shrink-0 text-ink-placeholder">
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="font-extrabold text-[14.5px] text-primary-dark">
          {props.label}
        </span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-display font-semibold text-base text-white"
        style={{ background: props.avatar.bg }}
      >
        {props.avatar.letter}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-[14.5px] text-ink">
          {props.name}
        </div>
        <div className="text-[12.5px] text-ink-faint">{props.relation}</div>
      </div>
      <span
        className={[
          "shrink-0 text-[10.5px] font-extrabold px-[9px] py-[4px] rounded-full",
          STATUS_BADGE[props.status],
        ].join(" ")}
      >
        {props.statusLabel}
      </span>
    </div>
  );
}