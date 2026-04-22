import { useMemo, useState, useCallback, useEffect } from "react";
import { Users } from "lucide-react";
import PhoneInputLib, {
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import type { Country, Value } from "react-phone-number-input";

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  onGuestsOpen?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

const DEFAULT_COUNTRY: Country = "UZ";

/** Kutubxona `value` uchun: saqlangan raqamlarni qayta parse qilmasdan +… (backspace / caret buzilmaydi). */
function digitsToInternationalValue(digits: string): Value | undefined {
  const d = digits.replace(/\D/g, "");
  if (!d) return undefined;
  return `+${d}` as Value;
}

function valueToStorageDigits(e164: string | undefined): string {
  if (!e164) return "";
  return e164.replace(/\D/g, "");
}

const PhoneInput = ({ value, onChange, onGuestsOpen, autoFocus, disabled }: PhoneInputProps) => {
  const [touched, setTouched] = useState(false);
  /** Qizil halqa va matn faqat maydon tashlab ketilganda — yozish/backspace paytida chalkashlik bo‘lmasin */
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    if (!value?.trim()) {
      setTouched(false);
      setBlurred(false);
    }
  }, [value]);

  const phoneValue = useMemo(() => digitsToInternationalValue(value), [value]);

  const e164ForChecks = useMemo(() => {
    const d = value.replace(/\D/g, "");
    return d ? `+${d}` : "";
  }, [value]);

  const showError =
    blurred &&
    touched &&
    e164ForChecks.length >= 8 &&
    !isValidPhoneNumber(e164ForChecks) &&
    !isPossiblePhoneNumber(e164ForChecks);

  const showIncomplete =
    blurred &&
    touched &&
    e164ForChecks.length >= 8 &&
    !isValidPhoneNumber(e164ForChecks) &&
    isPossiblePhoneNumber(e164ForChecks);

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(valueToStorageDigits(val));
    },
    [onChange]
  );

  return (
    <div className="space-y-1">
      <div className="flex flex-nowrap items-center gap-2">
        <div
          role="group"
          aria-label="Telefon"
          className={`phone-input-wrapper min-w-0 flex-1 overflow-hidden rounded-xl border border-input bg-card transition-all ${
            showError || showIncomplete
              ? "ring-2 ring-destructive/60"
              : "focus-within:ring-2 focus-within:ring-ring"
          } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        >
          <PhoneInputLib
            international
            defaultCountry={DEFAULT_COUNTRY}
            value={phoneValue}
            onChange={handleChange}
            onFocus={() => setBlurred(false)}
            onBlur={() => {
              setTouched(true);
              setBlurred(true);
            }}
            placeholder="+998 90 123 45 67"
            disabled={disabled}
            numberInputProps={{
              autoFocus,
              autoComplete: "tel",
              "aria-label": "Telefon raqami",
            }}
            className="PhoneInput--booking w-full min-w-0 h-12 px-2 text-foreground disabled:pointer-events-none"
          />
        </div>
        {onGuestsOpen ? (
          <button
            type="button"
            onClick={onGuestsOpen}
            disabled={disabled}
            className="h-12 shrink-0 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-all active:scale-[0.97] flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
          >
            <Users className="h-4 w-4" />
            Mehmonlar
          </button>
        ) : null}
      </div>
      {showError ? (
        <p className="text-xs font-medium text-destructive leading-snug">
          Telefon kodi yoki raqam mamlakat uchun mos emas.
        </p>
      ) : showIncomplete ? (
        <p className="text-xs font-medium text-destructive/90 leading-snug">
          Raqamni mamlakat qoidalariga mos ravishda toʻliq kiriting.
        </p>
      ) : null}
    </div>
  );
};

export default PhoneInput;
