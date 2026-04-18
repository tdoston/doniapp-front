import { Check, Users } from "lucide-react";

interface RepeatGuest {
  name: string;
  lastVisit: string;
  price: number;
  notes: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  repeatGuest: RepeatGuest | null;
  onAutoFill: (guest: RepeatGuest) => void;
  onGuestsOpen?: () => void;
  autoFocus?: boolean;
}

const PhoneInput = ({ value, onChange, repeatGuest, onAutoFill, onGuestsOpen, autoFocus }: PhoneInputProps) => {
  const display = value ? (value.startsWith("+") ? value : `+${value}`) : "";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Telefon raqami <span className="text-xs text-muted-foreground/70">(ixtiyoriy)</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={display}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits);
          }}
          placeholder="+998 90 123 45 67"
          autoFocus={autoFocus}
          className="flex-1 min-w-0 h-12 rounded-lg border border-input bg-card text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all px-3"
        />
        {onGuestsOpen && (
          <button
            type="button"
            onClick={onGuestsOpen}
            className="h-12 px-3 rounded-lg bg-primary/10 text-primary font-semibold text-xs whitespace-nowrap transition-all active:scale-[0.97] flex items-center gap-1.5 shrink-0"
          >
            <Users className="w-4 h-4" />
            Mehmonlar
          </button>
        )}
      </div>

      {repeatGuest && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <Check className="w-4 h-4" />
                Avval kelgan: {repeatGuest.name}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Oxirgi: {repeatGuest.lastVisit} · {repeatGuest.price.toLocaleString()} so'm
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAutoFill(repeatGuest)}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs whitespace-nowrap transition-all active:scale-[0.97]"
            >
              To'ldirish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
