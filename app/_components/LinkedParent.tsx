type ParentStatus = "activa" | "pendiente";

type ParentData = {
  avatar: { letter: string; bg: string };
  name: string;
  relation: string;
  statusLabel: string;
  status: ParentStatus;
};

type LinkedParentProps = ParentData;

const STATUS_BADGE: Record<ParentStatus, string> = {
  activa: "bg-badge-activa-bg text-badge-activa",
  pendiente: "bg-badge-pendiente-bg text-badge-pendiente",
};

export function LinkedParent(props: LinkedParentProps) {
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