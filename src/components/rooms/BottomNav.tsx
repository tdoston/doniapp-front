import React from "react";
import { BedDouble, Users, Wallet, Sparkles, UserCircle2 } from "lucide-react";
import { useUiLanguage } from "@/lib/ui-language";

interface BottomNavProps {
  active: string;
  onSelect: (tab: string) => void;
}

const BottomNav = ({ active, onSelect }: BottomNavProps) => {
  const { t } = useUiLanguage();
  const tabs = [
    { id: "rooms", label: t("Xonalar", "Комнаты"), icon: BedDouble },
    { id: "guests", label: t("Mehmonlar", "Гости"), icon: Users },
    { id: "payments", label: t("To'lov", "Оплата"), icon: Wallet },
    { id: "cleaning", label: t("Tozalik", "Уборка"), icon: Sparkles },
    { id: "profile", label: t("Profil", "Профиль"), icon: UserCircle2 },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
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
