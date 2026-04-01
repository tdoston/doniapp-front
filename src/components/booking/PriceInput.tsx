interface PriceInputProps {
  value: string;
  onChange: (val: string) => void;
}

const CHIPS = [100000, 80000, 75000, 70000];

const formatNumber = (val: string): string => {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("uz-UZ");
};

const PriceInput = ({ value, onChange }: PriceInputProps) => {
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
      <label className="text-sm font-medium text-muted-foreground">Kelishilgan narx (so'm)</label>
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
    </div>
  );
};

export default PriceInput;
