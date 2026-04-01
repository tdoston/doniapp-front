import React from "react";

interface BottomNavProps {
  hostels: string[];
  active: string;
  onSelect: (name: string) => void;
}

const BottomNav = ({ hostels, active, onSelect }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-foreground/95 backdrop-blur flex z-20">
      {hostels.map((h) => (
        <button
          key={h}
          onClick={() => onSelect(h)}
          className={`flex-1 py-3.5 text-sm font-bold transition-all ${
            active === h
              ? "bg-info text-info-foreground"
              : "text-card/70"
          }`}
        >
          {h}
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
