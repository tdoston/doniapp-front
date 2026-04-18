interface NotesInputProps {
  value: string;
  onChange: (val: string) => void;
  /** Tashqi sarlavha bo‘lsa (masalan Collapsible ichida). */
  hideLabel?: boolean;
}

const CHIPS = [
  "Qarz bo'ldi",
  "Oilali",
  "Zaryadnik oldi",
  "Kech keladi",
  "Erta ketadi",
];

const NotesInput = ({ value, onChange, hideLabel }: NotesInputProps) => {
  const addChip = (text: string) => {
    const sep = value.trim() ? ", " : "";
    onChange(value.trim() + sep + text.toLowerCase());
  };

  return (
    <div className="space-y-2">
      {!hideLabel ? <label className="text-sm font-medium text-muted-foreground">Izoh</label> : null}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Masalan: qarz bo'ldi 20 000, oilali…"
        rows={2}
        className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
      />
      <div className="flex gap-2 flex-wrap">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => addChip(c)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all"
          >
            + {c}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotesInput;
