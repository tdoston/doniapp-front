import React, { useState } from "react";
import { Users, Clock, Search, ChevronLeft } from "lucide-react";

export interface RecentGuest {
  name: string;
  phone: string;
  lastVisit: string;
  price: number;
  notes?: string;
  hostel?: string;
  room?: string;
}

export const RECENT_GUESTS: RecentGuest[] = [
  { name: "Miroj", phone: "998901234567", lastVisit: "Bugun", price: 80000, notes: "oilali", hostel: "Vodnik", room: "1-qavat Zal" },
  { name: "Akbar", phone: "998911234567", lastVisit: "Bugun", price: 75000, hostel: "Vodnik", room: "1-qavat Zal" },
  { name: "Fatima", phone: "998921234567", lastVisit: "Bugun", price: 90000, hostel: "Vodnik", room: "1-qavat Lux" },
  { name: "Sherzod", phone: "998931234567", lastVisit: "Kecha", price: 70000, hostel: "Vodnik", room: "2-qavat Zal" },
  { name: "Gulnora", phone: "998941234567", lastVisit: "Kecha", price: 70000, hostel: "Vodnik", room: "2-qavat Zal" },
  { name: "Alisher", phone: "998951234567", lastVisit: "Kecha", price: 120000, notes: "juftlik", hostel: "Vodnik", room: "2-qavat Dvuxspalniy" },
  { name: "Nodira", phone: "998961234567", lastVisit: "Kecha", price: 120000, hostel: "Vodnik", room: "2-qavat Dvuxspalniy" },
  { name: "Rustam", phone: "998971234567", lastVisit: "2 kun oldin", price: 50000, hostel: "Vodnik", room: "2-qavat Koridor" },
  { name: "Javohir", phone: "998981234567", lastVisit: "2 kun oldin", price: 65000, hostel: "Zargarlik", room: "Xona 1" },
  { name: "Sevara", phone: "998991234567", lastVisit: "2 kun oldin", price: 65000, hostel: "Zargarlik", room: "Xona 1" },
  { name: "Hamid", phone: "998901111111", lastVisit: "3 kun oldin", price: 60000, hostel: "Zargarlik", room: "Xona 3" },
  { name: "Zainab", phone: "998902222222", lastVisit: "3 kun oldin", price: 60000, hostel: "Zargarlik", room: "Xona 3" },
  { name: "Karim", phone: "998903333333", lastVisit: "3 kun oldin", price: 60000, hostel: "Zargarlik", room: "Xona 3" },
  { name: "Aziz", phone: "998906666666", lastVisit: "3 kun oldin", price: 100000, hostel: "Tabarruk", room: "Xona 1" },
  { name: "Bahor", phone: "998907777777", lastVisit: "4 kun oldin", price: 85000, hostel: "Tabarruk", room: "Xona 3" },
  { name: "Daler", phone: "998908888888", lastVisit: "5 kun oldin", price: 85000, hostel: "Tabarruk", room: "Xona 5" },
];

interface RecentGuestsProps {
  open: boolean;
  onClose: () => void;
  onSelect: (guest: RecentGuest) => void;
}

const filters = ["Hammasi", "Bugun", "Kecha", "2-3 kun"];

const RecentGuests = ({ open, onClose, onSelect }: RecentGuestsProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Hammasi");

  const filtered = RECENT_GUESTS.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search);

    const matchesFilter =
      filter === "Hammasi" ||
      (filter === "Bugun" && g.lastVisit === "Bugun") ||
      (filter === "Kecha" && g.lastVisit === "Kecha") ||
      (filter === "2-3 kun" && (g.lastVisit === "2 kun oldin" || g.lastVisit === "3 kun oldin"));

    return matchesSearch && matchesFilter;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-muted-foreground hover:bg-muted transition-colors active:scale-[0.98] font-semibold text-sm"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mehmonlar
          </h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism yoki telefon qidirish..."
            autoFocus
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-2 shrink-0">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">Mehmon topilmadi</p>
        ) : (
          filtered.map((guest) => (
            <button
              key={guest.phone}
              type="button"
              onClick={() => onSelect(guest)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 active:bg-muted transition-colors text-left border-b border-border/50"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">{guest.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground truncate">{guest.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {guest.lastVisit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>+{guest.phone.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}</span>
                  <span>·</span>
                  <span className="font-semibold">{guest.price.toLocaleString()} so'm</span>
                </div>
                {guest.hostel && (
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5 block">{guest.hostel} · {guest.room}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentGuests;
