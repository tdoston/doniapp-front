import React from "react";
import { addDays, format, isSameDay } from "date-fns";

interface CalendarBarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

const DAY_LABELS = ["YAK", "DU", "SE", "CHOR", "PAY", "JU", "SHAN"];

const CalendarBar = ({ selectedDate, onSelect }: CalendarBarProps) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 2));

  return (
    <div className="px-4 py-2 bg-card border-b border-border">
      <div className="grid grid-cols-7 gap-2">
      {days.map((day, i) => {
        const active = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        return (
          <button
            key={i}
            onClick={() => onSelect(day)}
            className={`relative flex w-full flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-semibold transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-md"
                : isToday
                ? "bg-secondary text-foreground ring-2 ring-primary/40"
                : "bg-background text-muted-foreground"
            }`}
          >
            {isToday && (
              <>
                <span
                  className="absolute -top-1.5 h-0 w-0 border-x-[5px] border-x-transparent border-b-0 border-t-[6px] border-t-primary/70"
                  aria-hidden="true"
                />
                <span className="absolute -top-5 rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  Bugun
                </span>
              </>
            )}
            <span className="text-[10px]">{DAY_LABELS[i]}</span>
            <span className="text-base font-bold">{format(day, "d")}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
};

export default CalendarBar;
