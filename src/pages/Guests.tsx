import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock } from "lucide-react";
import { fetchRecentGuests, recentGuestsQueryKey } from "@/lib/api";
import { checkInLabel } from "@/lib/dates";

const GuestsPage = () => {
  const limit = 200;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: recentGuestsQueryKey(limit),
    queryFn: () => fetchRecentGuests(limit),
    staleTime: 30_000,
  });

  const guests = data?.guests ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="w-12 h-12 mb-3 opacity-40 animate-pulse" />
        <p className="text-sm font-semibold">Yuklanmoqda…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-muted-foreground">
        <Users className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold text-destructive">Ma&apos;lumot olinmadi</p>
        <button type="button" onClick={() => refetch()} className="mt-3 text-xs font-bold text-primary underline">
          Qayta urinish
        </button>
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold">Hozircha mehmon yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-muted-foreground font-medium mb-3">So&apos;nggi check-inlar (telefon yoki pasport)</p>
      <ul className="space-y-0 divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
        {guests.map((g) => (
          <li key={`${g.lookupKey || g.phone}-${g.lastVisit}`} className="flex items-start gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{g.name[0]}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{g.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {checkInLabel(g.lastVisit)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(() => {
                  const d = (g.phone || "").replace(/\D/g, "");
                  if (d.length >= 9) return `+${d}`;
                  return g.passportSeries || g.phone || "—";
                })()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {g.hostel} · {g.room}
              </p>
            </div>
            <span className="text-xs font-bold text-foreground shrink-0">{g.price.toLocaleString()} so&apos;m</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuestsPage;
