import React from "react";
import { BedDouble, Users, Receipt, Sparkles, UserCog } from "lucide-react";

interface BottomNavProps {
  active: string;
  onSelect: (tab: string) => void;
}

const TABS = [
  { id: "rooms", label: "Xonalar", icon: BedDouble },
  { id: "guests", label: "Mehmonlar", icon: Users },
  { id: "payments", label: "To'lov", icon: Receipt },
  { id: "cleaning", label: "Tozalik", icon: Sparkles },
  { id: "staff", label: "Jamoa", icon: UserCog },
];

const BottomNav = ({ active, onSelect }: BottomNavProps) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
