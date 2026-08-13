type AllergyBoxProps = {
  title: string;
  text: string;
};

export function AllergyBox({ title, text }: AllergyBoxProps) {
  return (
    <div className="flex gap-[14px] rounded-2xl p-[16px_18px] bg-alergias-bg">
      <span className="w-10 h-10 rounded-[11px] shrink-0 flex items-center justify-center bg-alergias-icon-bg">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <div>
        <div className="font-extrabold text-alergias-title text-[15px] mb-[2px]">
          {title}
        </div>
        <div className="text-alergias-text text-[14.5px] leading-[1.5]">
          {text}
        </div>
      </div>
    </div>
  );
}