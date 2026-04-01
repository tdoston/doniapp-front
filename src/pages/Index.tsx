import { useState, useCallback } from "react";
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

const Index = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [price, setPrice] = useState(() => sessionStorage.getItem("lastPrice") || "");
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");

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
    setGender(guest.gender);
    toast.success("Ma'lumotlar to'ldirildi");
  };

  const isValid = phone.length >= 12 && price.replace(/\D/g, "").length > 0;

  const handleSave = () => {
    if (!isValid) return;
    toast.success("Mehmon saqlandi!");
    // Reset but keep last price
    setPhotos([]);
    setPhone("");
    setGender(null);
    setPaid("");
    setNotes("");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-extrabold text-primary">DoniHostel</h1>
        <p className="text-xs text-muted-foreground">Yangi mehmon ro'yxatga olish</p>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <PhotoUpload photos={photos} onAdd={handlePhotos} onRemove={removePhoto} />
        <PhoneInput
          value={phone}
          onChange={setPhone}
          repeatGuest={repeatGuest}
          onAutoFill={handleAutoFill}
          autoFocus
        />
        <GenderToggle value={gender} onChange={setGender} />
        <PriceInput value={price} onChange={setPrice} />
        <PaymentBlock price={price} paid={paid} onPaidChange={setPaid} />
        <NotesInput value={notes} onChange={setNotes} />
      </div>

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full h-14 rounded-xl font-bold text-base transition-all ${
            isValid
              ? "bg-primary text-primary-foreground shadow-lg active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isValid ? "Saqlash" : "Telefon raqami va narxni kiriting"}
        </button>
      </div>
    </div>
  );
};

export default Index;
