import PhoneInputLib from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
}

const PhoneInput = ({ value, onChange, autoFocus }: PhoneInputProps) => {
  const phoneValue = value ? (value.startsWith("+") ? value : `+${value}`) : undefined;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">Telefon</label>
      <div className="phone-input-wrapper">
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
    </div>
  );
};

export default PhoneInput;
