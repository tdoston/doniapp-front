import { useLayoutEffect, useRef } from "react";
import { BOOKING_FIELD_SHELL_CLASS, BOOKING_NOTES_TEXTAREA_CLASS } from "@/lib/bookingFieldStyles";
import { cn } from "@/lib/utils";

interface NotesInputProps {
  value: string;
  onChange: (val: string) => void;
  /** Tashqi sarlavha bo‘lsa `hideLabel` qo‘ying. */
  hideLabel?: boolean;
  disabled?: boolean;
  quickOptions?: string[];
}

const MIN_PX = 48;
const MAX_PX = 280;
const DEFAULT_CHECKIN_QUICK_OPTIONS = ["Zaryadnik oldi", "Kechroq ketadi"];

function appendQuickNote(current: string, note: string): string {
  const base = current.trim();
  if (!base) return note;
  if (base.toLowerCase().includes(note.toLowerCase())) return current;
  return `${base}, ${note}`;
}

const NotesInput = ({ value, onChange, hideLabel, disabled, quickOptions = DEFAULT_CHECKIN_QUICK_OPTIONS }: NotesInputProps) => {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = `${MIN_PX}px`;
    const next = Math.min(Math.max(MIN_PX, el.scrollHeight), MAX_PX);
    el.style.height = `${next}px`;
  }, [value]);

  return (
    <div className="space-y-2">
      {!hideLabel ? (
        <label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">Izoh</label>
      ) : null}
      <div className={cn(BOOKING_FIELD_SHELL_CLASS, disabled && "pointer-events-none opacity-60")}>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Masalan: qarz bo'ldi 20 000, oilali…"
          rows={1}
          maxLength={2000}
          readOnly={disabled}
          disabled={disabled}
          className={BOOKING_NOTES_TEXTAREA_CLASS}
        />
      </div>
      {quickOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quickOptions.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(appendQuickNote(value, option))}
              className="h-8 rounded-lg border border-border/70 bg-background px-3 text-xs font-semibold text-foreground/90 active:scale-[0.98] disabled:opacity-40"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default NotesInput;
