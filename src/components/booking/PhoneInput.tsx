import { Users } from "lucide-react";
import PhoneInputLib from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  onGuestsOpen?: () => void;
  autoFocus?: boolean;
}

const PhoneInput = ({ value, onChange, onGuestsOpen, autoFocus }: PhoneInputProps) => {
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
    </div>
  );
};

export default PhoneInput;
