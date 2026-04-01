import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import PhotoUpload from "@/components/booking/PhotoUpload";
import PhoneInput from "@/components/booking/PhoneInput";
import GenderToggle from "@/components/booking/GenderToggle";
import PriceInput from "@/components/booking/PriceInput";
import PaymentBlock from "@/components/booking/PaymentBlock";
import NotesInput from "@/components/booking/NotesInput";

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
  const isFullRoomBooking = prefill.bookingScope === "full-room";
  const normalizedPhone = (prefill.guestPhone || "").replace(/\D/g, "");

  const [photos, setPhotos] = useState<string[]>([]);
  const [phone, setPhone] = useState(normalizedPhone);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [price, setPrice] = useState(prefill.price || sessionStorage.getItem("lastPrice") || "");
  const [paid, setPaid] = useState(prefill.paid || "");
  const [notes, setNotes] = useState(() => {
    if (prefill.notes) return prefill.notes;
    if (prefill.guestName) return `Mijoz: ${prefill.guestName}`;
    return "";
  });

  const repeatGuest = MOCK_GUESTS[phone] || null;
  const roomOptions = prefill.roomOptions || [];
  const assignOptions = roomOptions.flatMap((room) =>
    Array.from({ length: room.totalBeds }, (_, idx) => {
      const bed = idx + 1;
      return {
        value: `${room.id}:${bed}`,
        label: `${room.name} · Karavot ${bed}`,
      };
    })
  );
  const initialAssignedSlot =
    prefill.roomId && prefill.bedId
      ? `${prefill.roomId}:${prefill.bedId}`
      : prefill.roomId && roomOptions.length > 0
      ? `${prefill.roomId}:1`
      : "";
  const [assignedSlot, setAssignedSlot] = useState(initialAssignedSlot);
  const [assignedRoomId, setAssignedRoomId] = useState(prefill.roomId || roomOptions[0]?.id || "");
  const selectedRoomForFull = roomOptions.find((room) => room.id === assignedRoomId);
  const fullRoomGuestCount = selectedRoomForFull?.totalBeds || 0;
  const [guestEntries, setGuestEntries] = useState<
    Array<{ gender: "male" | "female" | null; photos: string[] }>
  >([]);

  const syncGuestEntriesCount = useCallback((count: number) => {
    setGuestEntries((prev) => {
      if (count <= 0) return [];
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      return [
        ...prev,
        ...Array.from({ length: count - prev.length }, () => ({ gender: null, photos: [] })),
      ];
    });
  }, []);

  useEffect(() => {
    if (isFullRoomBooking) {
      syncGuestEntriesCount(fullRoomGuestCount);
    }
  }, [isFullRoomBooking, fullRoomGuestCount, syncGuestEntriesCount]);

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
    setGender(guest.gender);
    toast.success("Ma'lumotlar to'ldirildi");
  };

  const handleSave = () => {
    toast.success(prefill.mode === "edit" ? "Bron ma'lumotlari yangilandi!" : "Mehmon saqlandi!");
    // Reset but keep last price
    setPhone("");
    setGender(null);
    setPaid("");
    setNotes("");
    if (isFullRoomBooking) {
      setGuestEntries([]);
    } else {
      setPhotos([]);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleCopy = () => {
    const info = [
      prefill.hostel ? `Filial: ${prefill.hostel}` : "",
      prefill.roomName ? `Xona: ${prefill.roomName}` : "",
      prefill.bedId ? `Karavot: ${prefill.bedId}` : "",
      phone ? `Tel: +${phone}` : "",
      price ? `Narx: ${price}` : "",
      paid ? `To'langan: ${paid}` : "",
      notes ? `Izoh: ${notes}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(info);
    toast.success("Nusxalandi!");
  };

  const handleRoomForFullChange = (roomId: string) => {
    setAssignedRoomId(roomId);
    const selected = roomOptions.find((room) => room.id === roomId);
    syncGuestEntriesCount(selected?.totalBeds || 0);
  };

  const handleGuestGender = (index: number, nextGender: "male" | "female") => {
    setGuestEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, gender: nextGender } : entry))
    );
  };

  const handleGuestPhotos = (index: number, files: FileList) => {
    setGuestEntries((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      const remaining = 3 - current.photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setGuestEntries((inner) => {
            const innerNext = [...inner];
            const target = innerNext[index];
            if (!target) return inner;
            innerNext[index] = {
              ...target,
              photos: [...target.photos, e.target?.result as string].slice(0, 3),
            };
            return innerNext;
          });
        };
        reader.readAsDataURL(file);
      });
      return next;
    });
  };

  const handleGuestPhotoRemove = (guestIndex: number, photoIndex: number) => {
    setGuestEntries((prev) =>
      prev.map((entry, i) =>
        i === guestIndex
          ? { ...entry, photos: entry.photos.filter((_, idx) => idx !== photoIndex) }
          : entry
      )
    );
  };

  const hostelName = prefill.hostel || "Bron";

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(170px + env(safe-area-inset-bottom))",
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors active:scale-[0.98]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-extrabold text-primary">{hostelName}</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {prefill.mode === "edit"
            ? `${prefill.roomName || "Xona"} · ${prefill.bedId ? `Karavot ${prefill.bedId}` : "Bron"} tahrirlash`
            : "Yangi mehmon ro'yxatga olish"}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Joy biriktirish {prefill.hostel ? `· ${prefill.hostel}` : ""}
          </p>
          {isFullRoomBooking ? (
            <div>
              <label className="text-[11px] text-muted-foreground">Xona</label>
              <select
                value={assignedRoomId}
                onChange={(e) => handleRoomForFullChange(e.target.value)}
                className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Xona tanlang</option>
                {roomOptions.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.totalBeds} karavot)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-muted-foreground">Xona va karavot</label>
              <select
                value={assignedSlot}
                onChange={(e) => setAssignedSlot(e.target.value)}
                className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Joy tanlanmagan</option>
                {assignOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {isFullRoomBooking ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Har bir mehmon uchun pasport rasmi va jinsi
            </p>
            {guestEntries.map((entry, index) => (
              <div key={index} className="rounded-xl border border-border bg-card p-3 space-y-3">
                <p className="text-sm font-semibold text-foreground">Mehmon {index + 1}</p>
                <PhotoUpload
                  photos={entry.photos}
                  onAdd={(files) => handleGuestPhotos(index, files)}
                  onRemove={(photoIndex) => handleGuestPhotoRemove(index, photoIndex)}
                />
                <GenderToggle value={entry.gender} onChange={(val) => handleGuestGender(index, val)} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <PhotoUpload photos={photos} onAdd={handlePhotos} onRemove={removePhoto} />
            <GenderToggle value={gender} onChange={setGender} />
          </>
        )}
        <PhoneInput
          value={phone}
          onChange={setPhone}
          repeatGuest={repeatGuest}
          onAutoFill={handleAutoFill}
          autoFocus
        />
        {isFullRoomBooking && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Narx va to'lov bu yerda butun xona uchun umumiy hisoblanadi.
          </p>
        )}
        <PriceInput value={price} onChange={setPrice} />
        <PaymentBlock price={price} paid={paid} onPaidChange={setPaid} />
        <NotesInput value={notes} onChange={setNotes} />
      </div>

      {/* Sticky Actions */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t border-border"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="h-16 rounded-xl font-bold text-lg bg-muted text-foreground border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="h-16 rounded-xl font-bold text-lg bg-muted text-foreground border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Copy className="h-5 w-5" />
            Copy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-16 rounded-xl font-bold text-lg bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98]"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
