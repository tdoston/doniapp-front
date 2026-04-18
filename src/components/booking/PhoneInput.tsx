import { Check, Users } from "lucide-react";
import PhoneInputLib from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
  const phoneValue = value ? (value.startsWith("+") ? value : `+${value}`) : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">Telefon</label>
      <div className="flex items-center gap-2">
        <div className="phone-input-wrapper min-w-0 flex-1">
          <PhoneInputLib
            international
            defaultCountry="UZ"
            value={phoneValue}
            onChange={(val) => onChange(val ? val.replace(/\D/g, "") : "")}
            placeholder="Telefon raqamini kiriting"
            autoFocus={autoFocus}
            className="w-full h-12 rounded-xl border border-input bg-card text-foreground text-base font-medium focus-within:ring-2 focus-within:ring-ring transition-all px-3"
          />
        </div>
        {onGuestsOpen ? (
          <button
            type="button"
            onClick={onGuestsOpen}
            className="h-12 shrink-0 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-all active:scale-[0.97] flex items-center gap-1.5"
          >
            <Users className="h-4 w-4" />
            Mehmonlar
          </button>
        ) : null}
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
