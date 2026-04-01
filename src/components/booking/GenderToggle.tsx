interface GenderToggleProps {
  value: "male" | "female" | null;
  onChange: (val: "male" | "female") => void;
}

const GenderToggle = ({ value, onChange }: GenderToggleProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Jinsi</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("male")}
          className={`h-12 rounded-lg font-semibold text-base transition-all ${
            value === "male"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Erkak
        </button>
        <button
          type="button"
          onClick={() => onChange("female")}
          className={`h-12 rounded-lg font-semibold text-base transition-all ${
            value === "female"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border text-foreground"
          }`}
        >
          Ayol
        </button>
      </div>
    </div>
  );
};

export default GenderToggle;
