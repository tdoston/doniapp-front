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
  const [showFinancials, setShowFinancials] = useState(true);
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
        className={`rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--debt))] min-h-[80px] relative overflow-hidden ${pending ? "animate-pulse opacity-70" : ""}`}
      >
        {!pending && !showFinancials ? (
          <div className="absolute inset-0 backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/25 dark:border-white/10" />
        ) : null}
        <span className="text-3xl font-extrabold text-destructive z-[1]">
          {pending ? "—" : showFinancials ? stats.debt : "•••"}
        </span>
        <span className="text-xs font-semibold text-destructive">Qarzi</span>
      </div>
      <div className="rounded-xl p-4 flex flex-col items-center justify-center bg-[hsl(var(--income))] min-h-[80px] relative overflow-hidden">
        {!pending && !showFinancials ? (
          <div className="absolute inset-0 backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/25 dark:border-white/10" />
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowFinancials((p) => !p)}
          className="absolute top-2 right-2 text-accent z-[2] disabled:opacity-50"
          aria-label={showFinancials ? "Qarz va kirimni yashirish" : "Qarz va kirimni ko'rsatish"}
          title={showFinancials ? "Yashirish" : "Ko'rsatish"}
        >
          {showFinancials ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <div className="absolute top-2 left-2 text-[10px] font-semibold text-accent/80 z-[2]">Qarz + Kirim</div>
        <span className="text-3xl font-extrabold text-accent z-[1]">
          {pending ? "—" : showFinancials ? stats.revenue : "•••"}
        </span>
        <span className="text-xs font-semibold text-accent">Kirim</span>
      </div>
    </div>
  );
};

export default StatCards;
