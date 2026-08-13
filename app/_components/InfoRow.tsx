type InfoRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

export function InfoRow({ label, value, last = false }: InfoRowProps) {
  return (
    <div
      className={[
        "flex justify-between px-[18px] py-[15px] text-[14.5px]",
        last ? "" : "border-b border-divider",
      ].join(" ")}
    >
      <span className="text-ink-muted">{label}</span>
      <span className="font-extrabold text-ink">{value}</span>
    </div>
  );
}