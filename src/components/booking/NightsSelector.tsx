import { Minus, Plus } from "lucide-react";

interface NightsSelectorProps {
  value: number;
  onChange: (nights: number) => void;
}

const NightsSelector = ({ value, onChange }: NightsSelectorProps) => {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-2 block">
        Kechalar soni
      </label>
      <div className="flex items-center border border-border rounded-2xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="h-12 w-14 flex items-center justify-center text-primary text-xl font-bold active:bg-muted transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="flex-1 text-center text-xl font-bold text-foreground">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-12 w-14 flex items-center justify-center text-primary text-xl font-bold active:bg-muted transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NightsSelector;
