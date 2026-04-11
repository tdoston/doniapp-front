import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Copy, Plus, Trash2, UserPlus } from "lucide-react";
import PhotoUpload from "@/components/booking/PhotoUpload";
import PhoneInput from "@/components/booking/PhoneInput";
import PriceInput from "@/components/booking/PriceInput";
import PaymentBlock from "@/components/booking/PaymentBlock";
import NotesInput from "@/components/booking/NotesInput";
import RecentGuests, { RecentGuest, RECENT_GUESTS } from "@/components/booking/RecentGuests";

// Build phone lookup from recent guests
const GUEST_LOOKUP: Record<string, { name: string; lastVisit: string; price: number; notes: string; gender: "male" | "female" }> = {};
RECENT_GUESTS.forEach((g) => {
  GUEST_LOOKUP[g.phone] = { name: g.name, lastVisit: g.lastVisit, price: g.price, notes: g.notes || "", gender: "male" };
});

interface BookingPrefillState {
  mode?: "create" | "edit";
  bookingScope?: "bed" | "full-room";
  hostel?: string;
  roomId?: string;
  roomName?: string;
  bedId?: number;
  guestName?: string;
  guestPhone?: string;
  price?: string;
  paid?: string;
  notes?: string;
  checkedInBy?: string;
  roomOptions?: Array<{ id: string; name: string; totalBeds: number }>;
}

interface GuestEntry {
  id: number;
  phone: string;
  price: string;
  paid: string;
  nights: number;
  notes: string;
  photos: string[];
}

const createEmptyGuest = (id: number): GuestEntry => ({
  id,
  phone: "",
  price: sessionStorage.getItem("lastPrice") || "",
  paid: "",
  nights: 1,
  notes: "",
  photos: [],
});

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as BookingPrefillState | null) || {};
  const normalizedPhone = (prefill.guestPhone || "").replace(/\D/g, "");
  const isFullRoom = prefill.bookingScope === "full-room";
  const isEditMode = prefill.mode === "edit";

  // Single guest state
  const [showRecentGuests, setShowRecentGuests] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [phone, setPhone] = useState(normalizedPhone);
  const [price, setPrice] = useState(() => {
    if (prefill.price) return prefill.price;
    return sessionStorage.getItem("lastPrice") || "";
  });
  const [paid, setPaid] = useState(prefill.paid || "");
  const [notes, setNotes] = useState(() => {
    if (prefill.notes) return prefill.notes;
    if (prefill.guestName) return `Mijoz: ${prefill.guestName}`;
    return "";
  });
  const [nights, setNights] = useState(1);

  // Multi-guest state (full room)
  const [guests, setGuests] = useState<GuestEntry[]>(() => [createEmptyGuest(1)]);
  const [activeGuestIdx, setActiveGuestIdx] = useState(0);

  const repeatGuest = GUEST_LOOKUP[isFullRoom ? guests[activeGuestIdx]?.phone || "" : phone] || null;

  const handlePhotos = useCallback((files: FileList) => {
    if (isFullRoom) {
      const guest = guests[activeGuestIdx];
      if (!guest) return;
      const remaining = 3 - guest.photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setGuests((prev) =>
            prev.map((g, i) =>
              i === activeGuestIdx
                ? { ...g, photos: [...g.photos, e.target?.result as string].slice(0, 3) }
                : g
            )
          );
        };
        reader.readAsDataURL(file);
      });
    } else {
      const remaining = 3 - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos((prev) => [...prev, e.target?.result as string].slice(0, 3));
        };
        reader.readAsDataURL(file);
      });
    }
  }, [photos.length, isFullRoom, guests, activeGuestIdx]);

  const removePhoto = (i: number) => {
    if (isFullRoom) {
      setGuests((prev) =>
        prev.map((g, idx) =>
          idx === activeGuestIdx
            ? { ...g, photos: g.photos.filter((_, pi) => pi !== i) }
            : g
        )
      );
    } else {
      setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    }
  };

  const replacePhoto = (i: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (isFullRoom) {
        setGuests((prev) =>
          prev.map((g, idx) =>
            idx === activeGuestIdx
              ? { ...g, photos: g.photos.map((p, pi) => (pi === i ? url : p)) }
              : g
          )
        );
      } else {
        setPhotos((prev) => prev.map((p, idx) => (idx === i ? url : p)));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoFill = (guest: typeof GUEST_LOOKUP[string]) => {
    if (isFullRoom) {
      updateGuest(activeGuestIdx, { price: String(guest.price), notes: guest.notes });
    } else {
      setPrice(String(guest.price));
      setNotes(guest.notes);
    }
    
  };

  const handleRecentGuestSelect = (guest: RecentGuest) => {
    if (isFullRoom) {
      updateGuest(activeGuestIdx, {
        phone: guest.phone,
        price: String(guest.price),
        notes: guest.notes || "",
      });
    } else {
      setPhone(guest.phone);
      setPrice(String(guest.price));
      if (guest.notes) setNotes(guest.notes);
    }
    
  };

  const updateGuest = (idx: number, data: Partial<GuestEntry>) => {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...data } : g)));
  };

  const addGuest = () => {
    const newId = guests.length + 1;
    setGuests((prev) => [...prev, createEmptyGuest(newId)]);
    setActiveGuestIdx(guests.length);
  };

  const removeGuest = (idx: number) => {
    if (guests.length <= 1) return;
    setGuests((prev) => prev.filter((_, i) => i !== idx));
    setActiveGuestIdx((prev) => Math.min(prev, guests.length - 2));
  };

  const handleSave = () => {
    if (isEditMode && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    
    if (isFullRoom) {
      setGuests([createEmptyGuest(1)]);
      setActiveGuestIdx(0);
    } else {
      setPhone("");
      setPaid("");
      setNotes("");
      setPhotos([]);
    }
    navigate(-1);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleCopyPhone = () => {
    const p = isFullRoom ? guests[activeGuestIdx]?.phone : phone;
    if (p) {
      navigator.clipboard.writeText(`+${p}`);
    }
  };

  const hostelName = prefill.hostel || "Bron";
  const activeGuest = guests[activeGuestIdx];

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-muted-foreground hover:bg-muted transition-colors active:scale-[0.98] font-semibold text-sm"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          <h1 className="text-lg font-extrabold text-primary">{hostelName}</h1>
          {isEditMode && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-warning/20 text-warning">Tahrirlash</span>
          )}
          {prefill.roomName && (
            <span className="text-xs text-muted-foreground">
              · {prefill.roomName}{prefill.bedId ? ` · K${prefill.bedId}` : ""}
            </span>
          )}
        </div>
        {isEditMode && prefill.checkedInBy && (
          <p className="text-xs text-muted-foreground mt-1 px-1">
            Check-in qilgan: <span className="font-semibold text-foreground">{prefill.checkedInBy}</span>
          </p>
        )}
        {isFullRoom && (
          <p className="text-xs text-muted-foreground mt-1 px-1">
            To'liq xona bron · {guests.length} mehmon
          </p>
        )}
      </div>

      {/* Multi-guest tabs for full room */}
      {isFullRoom && (
        <div className="bg-card border-b border-border px-3 py-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            {guests.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => setActiveGuestIdx(idx)}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  idx === activeGuestIdx
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                Mehmon {idx + 1}
                {g.phone && (
                  <span className="opacity-70">·{g.phone.slice(-4)}</span>
                )}
                {guests.length > 1 && idx === activeGuestIdx && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGuest(idx);
                    }}
                    className="ml-1 p-0.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={addGuest}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary whitespace-nowrap active:bg-primary/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Qo'shish
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <PhotoUpload
            photos={isFullRoom ? activeGuest?.photos || [] : photos}
            onAdd={handlePhotos}
            onRemove={removePhoto}
          />

          <RecentGuests
            open={showRecentGuests}
            onClose={() => setShowRecentGuests(false)}
            onSelect={(guest) => { handleRecentGuestSelect(guest); setShowRecentGuests(false); }}
          />
          
          <PhoneInput
            value={isFullRoom ? activeGuest?.phone || "" : phone}
            onChange={(v) => isFullRoom ? updateGuest(activeGuestIdx, { phone: v }) : setPhone(v)}
            repeatGuest={repeatGuest}
            onAutoFill={handleAutoFill}
            onGuestsOpen={() => setShowRecentGuests(!showRecentGuests)}
            autoFocus
          />
          <PriceInput
            value={isFullRoom ? activeGuest?.price || "" : price}
            onChange={(v) => isFullRoom ? updateGuest(activeGuestIdx, { price: v }) : setPrice(v)}
            nights={isFullRoom ? activeGuest?.nights || 1 : nights}
            onNightsChange={(v) => isFullRoom ? updateGuest(activeGuestIdx, { nights: v }) : setNights(v)}
          />
          <PaymentBlock
            price={isFullRoom ? activeGuest?.price || "" : price}
            paid={isFullRoom ? activeGuest?.paid || "" : paid}
            nights={isFullRoom ? activeGuest?.nights || 1 : nights}
            onPaidChange={(v) => isFullRoom ? updateGuest(activeGuestIdx, { paid: v }) : setPaid(v)}
          />
          <NotesInput
            value={isFullRoom ? activeGuest?.notes || "" : notes}
            onChange={(v) => isFullRoom ? updateGuest(activeGuestIdx, { notes: v }) : setNotes(v)}
          />
        </div>
      </div>

      {/* Sticky Actions */}
      <div
        className="bg-card/95 backdrop-blur border-t border-border px-4 py-3 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="h-14 rounded-xl font-bold text-base bg-muted text-foreground border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-14 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
          >
            {isEditMode ? "O'zgartirish" : "Saqlash"}
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="bg-card rounded-2xl mx-6 p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <h2 className="text-lg font-extrabold text-foreground mb-2">O'zgartirishni tasdiqlang</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Mehmon ma'lumotlari o'zgartiriladi. Davom etasizmi?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-12 rounded-xl font-bold text-sm bg-muted text-foreground border border-border transition-all active:scale-[0.98]"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
