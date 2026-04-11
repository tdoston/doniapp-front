import { Moon } from "lucide-react";

interface NightsSelectorProps {
  value: number;
  onChange: (nights: number) => void;
}

const NightsSelector = ({ value, onChange }: NightsSelectorProps) => {
  const options = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
        <Moon className="w-3.5 h-3.5" />
        Necha kecha
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 min-w-[2.75rem] px-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              value === n
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-muted-foreground hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
        {!options.includes(value) && value > 7 && (
          <button
            type="button"
            className="h-10 min-w-[2.75rem] px-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-md"
          >
            {value}
          </button>
        )}
        <input
          type="number"
          min={1}
          placeholder="..."
          value={value > 7 ? value : ""}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (v > 0) onChange(v);
          }}
          className="h-10 w-14 rounded-xl text-sm font-bold text-center bg-secondary text-foreground border border-border focus:ring-2 focus:ring-primary/30 outline-none"
        />
      </div>
    </div>
  );
};

export default NightsSelector;
