import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

const DateSelector = ({ selectedDate, onSelect }: DateSelectorProps) => {
  const goBack = () => onSelect(subDays(selectedDate, 1));
  const goForward = () => onSelect(addDays(selectedDate, 1));
  const goToday = () => onSelect(new Date());

  const label = isToday(selectedDate)
    ? "Bugun"
    : format(selectedDate, "d-MMMM, yyyy");

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
      <button
        onClick={goBack}
        className="p-2 rounded-lg bg-secondary text-foreground active:bg-secondary/70"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={goToday}
        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
          isToday(selectedDate)
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground"
        }`}
      >
        {label}
      </button>

      <button
        onClick={goForward}
        className="p-2 rounded-lg bg-secondary text-foreground active:bg-secondary/70"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default DateSelector;
