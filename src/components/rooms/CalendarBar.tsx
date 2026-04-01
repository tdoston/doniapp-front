import React from "react";
import { addDays, format, isSameDay } from "date-fns";

interface CalendarBarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

const DAY_LABELS = ["YAK", "DU", "SE", "CHOR", "PAY", "JU", "SHAN"];

const CalendarBar = ({ selectedDate, onSelect }: CalendarBarProps) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - today.getDay() + 1));

  return (
    <div className="flex gap-1 overflow-x-auto px-4 py-2 bg-card border-b border-border scrollbar-hide">
      {days.map((day, i) => {
        const active = isSameDay(day, selectedDate);
        return (
          <button
            key={i}
            onClick={() => onSelect(day)}
            className={`flex flex-col items-center min-w-[44px] py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-md"
                : isSameDay(day, today)
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <span className="text-[10px]">{DAY_LABELS[i]}</span>
            <span className="text-base font-bold">{format(day, "d")}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CalendarBar;
