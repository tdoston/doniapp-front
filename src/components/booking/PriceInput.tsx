import { Minus, Plus } from "lucide-react";
import { BOOKING_FIELD_SHELL_CLASS, BOOKING_SINGLE_LINE_INPUT_CLASS } from "@/lib/bookingFieldStyles";
import { cn } from "@/lib/utils";
import { digitsFromSoumInput, formatSoumDisplay } from "@/lib/moneyInput";

interface PriceInputProps {
  value: string;
  onChange: (val: string) => void;
  nights: number;
  onNightsChange: (nights: number) => void;
  disabled?: boolean;
}

const CHIPS = [150000, 100000, 80000, 70000];

const PriceInput = ({ value, onChange, nights, onNightsChange, disabled }: PriceInputProps) => {
  const priceNum = Number(digitsFromSoumInput(value)) || 0;
  const totalPrice = priceNum * nights;

  const handleChip = (amount: number) => {
    if (disabled) return;
    onChange(String(amount));
    sessionStorage.setItem("lastPrice", String(amount));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const raw = digitsFromSoumInput(e.target.value);
    onChange(raw);
    if (raw) sessionStorage.setItem("lastPrice", raw);
  };

  return (
    <div className="space-y-2">
      <label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">Narx / kecha</label>
      <div className={cn(BOOKING_FIELD_SHELL_CLASS, disabled && "pointer-events-none opacity-60")}>
        <input
          type="text"
          inputMode="numeric"
          value={formatSoumDisplay(value)}
          onChange={handleInput}
          placeholder="Narxni kiriting"
          readOnly={disabled}
          disabled={disabled}
          className={BOOKING_SINGLE_LINE_INPUT_CLASS}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => handleChip(c)}
            className={`px-4 py-2 rounded-full text-[0.8125rem] font-bold transition-all ${
              value === String(c)
                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                : "bg-muted text-foreground border border-border/80 hover:bg-muted/80"
            }`}
          >
            {(c / 1000)}k
          </button>
        ))}
      </div>

      {/* Kechalar + umumiy: ramkasiz — yuqoridagi narx/chiplardan engil chiziq bilan ajraladi */}
      <div className="mt-2 flex flex-nowrap items-center gap-3 border-t border-border/50 pt-3">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-background">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNightsChange(Math.max(1, nights - 1))}
              className="h-10 w-10 flex items-center justify-center text-primary active:bg-muted transition-colors disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="min-w-[2.5rem] px-1 text-center text-base font-bold tabular-nums text-foreground">{nights}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onNightsChange(nights + 1)}
              className="h-10 w-10 flex items-center justify-center text-primary active:bg-muted transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">kecha</span>
        </div>
        <div className="min-w-0 flex-1 flex flex-col items-end justify-center gap-0.5 text-right leading-tight">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">Umumiy</span>
          <span className="text-base font-extrabold tabular-nums text-foreground whitespace-nowrap sm:text-[1.0625rem]">
            {totalPrice > 0 ? `${totalPrice.toLocaleString("uz-UZ")} so'm` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceInput;
