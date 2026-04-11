import { Check, Users } from "lucide-react";
import PhoneInputLib from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface RepeatGuest {
  name: string;
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
  onGuestsOpen?: () => void;
  autoFocus?: boolean;
}

const PhoneInput = ({ value, onChange, repeatGuest, onAutoFill, onGuestsOpen, autoFocus }: PhoneInputProps) => {
  const phoneValue = value ? (value.startsWith("+") ? value : `+${value}`) : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Telefon raqami</label>
      <div className="flex items-center gap-2">
        <div className="phone-input-wrapper flex-1 min-w-0">
          <PhoneInputLib
            international
            defaultCountry="UZ"
            value={phoneValue}
            onChange={(val) => onChange(val ? val.replace(/\D/g, "") : "")}
            placeholder="Telefon raqamini kiriting"
            autoFocus={autoFocus}
            className="w-full h-12 rounded-lg border border-input bg-card text-foreground text-base font-medium focus-within:ring-2 focus-within:ring-ring transition-all px-3"
          />
        </div>
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
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-1">
            <Check className="w-4 h-4" />
            Avval kelgan: {repeatGuest.name}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Oxirgi: {repeatGuest.lastVisit} · {repeatGuest.price.toLocaleString()} so'm
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
