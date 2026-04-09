import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import PhotoUpload from "@/components/booking/PhotoUpload";
import PhoneInput from "@/components/booking/PhoneInput";
import PriceInput from "@/components/booking/PriceInput";
import PaymentBlock from "@/components/booking/PaymentBlock";
import NotesInput from "@/components/booking/NotesInput";
import RecentGuests, { RecentGuest } from "@/components/booking/RecentGuests";

// Mock repeat guest data
const MOCK_GUESTS: Record<string, { lastVisit: string; price: number; notes: string; gender: "male" | "female" }> = {
  "998901234567": { lastVisit: "2024-03-15", price: 80000, notes: "oilali", gender: "male" },
};

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
  roomOptions?: Array<{ id: string; name: string; totalBeds: number }>;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as BookingPrefillState | null) || {};
  const normalizedPhone = (prefill.guestPhone || "").replace(/\D/g, "");

  const [photos, setPhotos] = useState<string[]>([]);
  const [phone, setPhone] = useState(normalizedPhone);
  const [price, setPrice] = useState(prefill.price || sessionStorage.getItem("lastPrice") || "");
  const [paid, setPaid] = useState(prefill.paid || "");
  const [notes, setNotes] = useState(() => {
    if (prefill.notes) return prefill.notes;
    if (prefill.guestName) return `Mijoz: ${prefill.guestName}`;
    return "";
  });

  const repeatGuest = MOCK_GUESTS[phone] || null;

  const handlePhotos = useCallback((files: FileList) => {
    const remaining = 3 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((prev) => [...prev, e.target?.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  }, [photos.length]);

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const handleAutoFill = (guest: typeof MOCK_GUESTS[string]) => {
    setPrice(String(guest.price));
    setNotes(guest.notes);
    toast.success("Ma'lumotlar to'ldirildi");
  };

  const handleSave = () => {
    toast.success(prefill.mode === "edit" ? "Bron ma'lumotlari yangilandi!" : "Mehmon saqlandi!");
    setPhone("");
    setPaid("");
    setNotes("");
    setPhotos([]);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleCopyPhone = () => {
    if (phone) {
      navigator.clipboard.writeText(`+${phone}`);
      toast.success("Telefon nusxalandi!");
    }
  };

  const hostelName = prefill.hostel || "Bron";

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
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
          {prefill.roomName && (
            <span className="text-xs text-muted-foreground">
              · {prefill.roomName}{prefill.bedId ? ` · K${prefill.bedId}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Form - scrollable area that fits between header and footer */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <PhotoUpload photos={photos} onAdd={handlePhotos} onRemove={removePhoto} />
          <PhoneInput
            value={phone}
            onChange={setPhone}
            repeatGuest={repeatGuest}
            onAutoFill={handleAutoFill}
            autoFocus
          />
          <PriceInput value={price} onChange={setPrice} />
          <PaymentBlock price={price} paid={paid} onPaidChange={setPaid} />
          <NotesInput value={notes} onChange={setNotes} />
        </div>
      </div>

      {/* Sticky Actions */}
      <div
        className="bg-card/95 backdrop-blur border-t border-border px-4 py-3 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
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
            onClick={handleCopyPhone}
            className="h-14 rounded-xl font-bold text-base bg-muted text-foreground border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-14 rounded-xl font-bold text-base bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
