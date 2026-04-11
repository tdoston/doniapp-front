import { Minus, Plus } from "lucide-react";

interface PriceInputProps {
  value: string;
  onChange: (val: string) => void;
  nights: number;
  onNightsChange: (nights: number) => void;
}

const CHIPS = [100000, 80000, 75000, 70000];

const formatNumber = (val: string): string => {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("uz-UZ");
};

const PriceInput = ({ value, onChange, nights, onNightsChange }: PriceInputProps) => {
  const priceNum = Number(value.replace(/\D/g, "")) || 0;
  const totalPrice = priceNum * nights;

  const handleChip = (amount: number) => {
    onChange(String(amount));
    sessionStorage.setItem("lastPrice", String(amount));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw);
    if (raw) sessionStorage.setItem("lastPrice", raw);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Kelishilgan narx (1 kecha)</label>
      <input
        type="text"
        inputMode="numeric"
        value={formatNumber(value)}
        onChange={handleInput}
        placeholder="Narxni kiriting"
        className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
      <div className="flex gap-2 flex-wrap">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => handleChip(c)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              value === String(c)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {(c / 1000)}k
          </button>
        ))}
      </div>

      {/* Nights + Total */}
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-card">
          <button
            type="button"
            onClick={() => onNightsChange(Math.max(1, nights - 1))}
            className="h-10 w-10 flex items-center justify-center text-primary active:bg-muted transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-base font-bold text-foreground">{nights}</span>
          <button
            type="button"
            onClick={() => onNightsChange(nights + 1)}
            className="h-10 w-10 flex items-center justify-center text-primary active:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">kecha</span>
        <div className="ml-auto text-right">
          <span className="text-xs text-muted-foreground">Umumiy: </span>
          <span className="text-base font-bold text-foreground">
            {totalPrice > 0 ? `${totalPrice.toLocaleString("uz-UZ")} so'm` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceInput;
