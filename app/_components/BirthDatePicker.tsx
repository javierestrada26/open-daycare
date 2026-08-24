"use client";

import { useMemo } from "react";

export type BirthDateValue = {
  day: number | null;
  month: number | null;
  year: number | null;
};

type BirthDatePickerProps = {
  value: BirthDateValue;
  onChange: (value: BirthDateValue) => void;
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const SELECT_CLASS =
  "w-full appearance-none px-[16px] py-[13px] pr-[40px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink font-bold outline-none";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const list: number[] = [];
    for (let y = current; y >= current - 10; y--) list.push(y);
    return list;
  }, []);

  const maxDay =
    value.year !== null && value.month !== null
      ? daysInMonth(value.year, value.month)
      : 31;
  const days = useMemo(() => {
    const list: number[] = [];
    for (let d = 1; d <= maxDay; d++) list.push(d);
    return list;
  }, [maxDay]);

  function handleDay(day: number) {
    onChange({ ...value, day });
  }

  function handleMonth(month: number) {
    let nextDay = value.day;
    if (value.year !== null && nextDay !== null) {
      const max = daysInMonth(value.year, month);
      if (nextDay > max) nextDay = max;
    }
    onChange({ ...value, month, day: nextDay });
  }

  function handleYear(year: number) {
    let nextDay = value.day;
    if (value.month !== null && nextDay !== null) {
      const max = daysInMonth(year, value.month);
      if (nextDay > max) nextDay = max;
    }
    onChange({ ...value, year, day: nextDay });
  }

  return (
    <div className="flex gap-[14px]">
      <div className="flex-1">
        <div className="relative">
          <select
            value={value.day ?? ""}
            onChange={(e) => handleDay(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Día
            </option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>

      <div className="flex-1">
        <div className="relative">
          <select
            value={value.month ?? ""}
            onChange={(e) => handleMonth(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Mes
            </option>
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>

      <div className="flex-1">
        <div className="relative">
          <select
            value={value.year ?? ""}
            onChange={(e) => handleYear(Number(e.target.value))}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Año
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown />
        </div>
      </div>
    </div>
  );
}
