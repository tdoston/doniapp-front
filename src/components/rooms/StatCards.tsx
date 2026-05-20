import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface StatsData {
  empty: number;
  guests: number;
  debt: number;
  revenue: number;
}

interface StatCardsProps {
  stats: StatsData;
  /** true: raqamlar DBdan kelmaguncha placeholder (statik xonalar sonidan foydalanmaymiz) */
  pending?: boolean;
}

const StatCards = ({ stats, pending }: StatCardsProps) => {
  const [showRevenue, setShowRevenue] = useState(true);
  const n = (v: number) => (pending ? "—" : v);
  const totalBeds = stats.empty + stats.guests;
  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-3">
      <div
        className={`rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--empty))] min-h-[80px] ${pending ? "animate-pulse opacity-70" : ""}`}
      >
        <span className="text-3xl font-extrabold text-[hsl(30,80%,20%)]">
          {pending ? "—" : `${stats.empty}/${totalBeds}`}
        </span>
        <span className="text-xs font-semibold text-[hsl(30,60%,30%)]">Bo'sh</span>
      </div>
      <div
        className={`rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--guest))] min-h-[80px] ${pending ? "animate-pulse opacity-70" : ""}`}
      >
        <span className="text-3xl font-extrabold text-[hsl(215,60%,25%)]">{n(stats.guests)}</span>
        <span className="text-xs font-semibold text-[hsl(215,40%,35%)]">Mehmon</span>
      </div>
      <div
        className={`rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--debt))] min-h-[80px] ${pending ? "animate-pulse opacity-70" : ""}`}
      >
        <span className="text-3xl font-extrabold text-destructive">{n(stats.debt)}</span>
        <span className="text-xs font-semibold text-destructive">Qarzi</span>
      </div>
      <div
        className={`rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--income))] min-h-[80px] relative ${pending ? "" : "cursor-pointer"}`}
        onClick={() => !pending && setShowRevenue((p) => !p)}
      >
       <div className="absolute top-2 right-2 text-accent">
          {showRevenue ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </div>
        <span className="text-3xl font-extrabold text-accent">
          {pending ? "—" : showRevenue ? stats.revenue : "•••"}
        </span>
        <span className="text-xs font-semibold text-accent">Kirim</span>
      </div>
    </div>
  );
};

export default StatCards;
