import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { fetchRecentGuests, recentGuestsQueryKey } from "@/lib/api";
import { checkInLabel } from "@/lib/dates";

const PaymentsPage = () => {
  const limit = 200;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: recentGuestsQueryKey(limit),
    queryFn: () => fetchRecentGuests(limit),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    return (data?.guests ?? []).map((g) => {
      const price = g.price;
      const paid = g.paid;
      const debt = Math.max(0, price - paid);
      return { ...g, paid, debt };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Receipt className="w-12 h-12 mb-3 opacity-40 animate-pulse" />
        <p className="text-sm font-semibold">Yuklanmoqda…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-muted-foreground">
        <Receipt className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold text-destructive">Ma&apos;lumot olinmadi</p>
        <button type="button" onClick={() => refetch()} className="mt-3 text-xs font-bold text-primary underline">
          Qayta urinish
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Receipt className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm font-semibold">To&apos;lov yozuvlari yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-muted-foreground font-medium mb-3">
        So&apos;nggi bronlar (to&apos;langan va qoldiq — faqat APIdagi oxirgi yozuv)
      </p>
      <div className="space-y-2 md:hidden">
        {rows.map((g) => (
          <div key={`${g.phone}-${g.lastVisit}`} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{g.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">+{g.phone}</div>
              </div>
              <div className="text-[11px] text-muted-foreground whitespace-nowrap">{checkInLabel(g.lastVisit)}</div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">Narx</div>
                <div className="font-semibold tabular-nums">{g.price.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                <div className="text-muted-foreground">To&apos;langan</div>
                <div className="font-semibold tabular-nums">{g.paid.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-destructive/10 px-2 py-1.5">
                <div className="text-destructive/80">Qoldiq</div>
                <div className="font-bold text-destructive tabular-nums">{g.debt.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-xl overflow-hidden bg-card">
          <thead className="bg-muted/50 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2">Mehmon</th>
              <th className="px-3 py-2">Sana</th>
              <th className="px-3 py-2 text-right">Narx</th>
              <th className="px-3 py-2 text-right">To&apos;langan</th>
              <th className="px-3 py-2 text-right">Qoldiq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((g) => (
              <tr key={`${g.phone}-${g.lastVisit}`}>
                <td className="px-3 py-2 font-medium">
                  <div>{g.name}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">+{g.phone}</div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{checkInLabel(g.lastVisit)}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{g.price.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{g.paid.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-destructive">{g.debt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
