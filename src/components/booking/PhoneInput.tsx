import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

interface RepeatGuest {
  lastVisit: string;
  price: number;
  notes: string;
  gender: "male" | "female";
}

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  repeatGuest: RepeatGuest | null;
  onAutoFill: (guest: RepeatGuest) => void;
  autoFocus?: boolean;
}

const formatPhone = (raw: string): string => {
  const d = raw.replace(/\D/g, "").slice(0, 12);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
};

const PhoneInput = ({ value, onChange, repeatGuest, onAutoFill, autoFocus }: PhoneInputProps) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => ref.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Telefon raqami</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">+</span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={formatPhone(value)}
          onChange={handleChange}
          placeholder="998 XX XXX XX XX"
          className="w-full h-12 pl-7 pr-4 rounded-lg border border-input bg-card text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      {repeatGuest && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-1">
            <Check className="w-4 h-4" />
            Avval kelgan mijoz
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Oxirgi tashrif: {repeatGuest.lastVisit} · {repeatGuest.price.toLocaleString()} so'm
          </p>
          <button
            type="button"
            onClick={() => onAutoFill(repeatGuest)}
            className="text-xs font-semibold text-primary underline"
          >
            Ma'lumotni to'ldirish
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
