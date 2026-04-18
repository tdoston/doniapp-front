import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Camera, ChevronDown, ChevronLeft, Copy, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PhotoUpload from "@/components/booking/PhotoUpload";
import PhoneInput from "@/components/booking/PhoneInput";
import PriceInput from "@/components/booking/PriceInput";
import PaymentBlock from "@/components/booking/PaymentBlock";
import NotesInput from "@/components/booking/NotesInput";
import RecentGuests from "@/components/booking/RecentGuests";
import type { RecentGuest } from "@/components/booking/RecentGuests";
import RepeatGuestBanner from "@/components/booking/RepeatGuestBanner";
import type { BookingPrefillState } from "@/types/bookingPrefill";
import {
  ApiError,
  createBooking,
  deleteBooking,
  digitsOnly,
  extractGuestNameFromIdImage,
  fetchRecentGuests,
  patchBooking,
  recentGuestsQueryKey,
} from "@/lib/api";
import { computeGuestLookupKey, lineHasValidGuestIdentity, normalizePassportSeries } from "@/lib/guestIdentity";
import { applyMijozNameToNotes } from "@/lib/guestNotes";
import { checkInLabel, formatCheckInDateTime } from "@/lib/dates";

function guestNameFromNotes(notes: string): string {
  const m = notes.match(/^Mijoz:\s*(.+)$/i);
  return m ? m[1].trim() : "";
}

interface GuestEntry {
  id: number;
  phone: string;
  passportSeries: string;
  price: string;
  paid: string;
  nights: number;
  notes: string;
  photos: string[];
}

/** So‘nggi muvaffaqiyatli ID/OCR javobi (UI blok) */
interface IdOcrPreview {
  photoDataUrl: string;
  fullName: string;
  documentNumber: string;
  rawPreview: string;
}

/** Bekor qilishda tanlanadigan 4 ta sabab (API ga `cancelReason` matni sifatida ketadi). */
const BOOKING_CANCEL_REASONS = [
  { value: "no_show", label: "Mehmon kelmadi" },
  { value: "wrong_booking", label: "Bron xato / ma'lumot noto'g'ri" },
  { value: "early_leave", label: "Muddatidan oldin ketdi" },
  { value: "other", label: "Boshqa sabab" },
] as const;

const createEmptyGuest = (id: number): GuestEntry => ({
  id,
  phone: "",
  passportSeries: "",
  price: sessionStorage.getItem("lastPrice") || "",
  paid: "",
  nights: 1,
  notes: "",
  photos: [],
});

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const prefill = (location.state as BookingPrefillState | null) || {};

  const isFullRoom = prefill.bookingScope === "full-room";
  const isEditMode = prefill.mode === "edit";

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const stayDateIso = prefill.stayDate ?? todayIso;

  const recentLimit = 120;
  const { data: recentData } = useQuery({
    queryKey: recentGuestsQueryKey(recentLimit),
    queryFn: () => fetchRecentGuests(recentLimit),
    staleTime: 60_000,
  });

  const guestLookup = useMemo(() => {
    const m: Record<string, { name: string; lastVisit: string; price: number; notes: string }> = {};
    (recentData?.guests ?? []).forEach((g) => {
      const key = g.lookupKey || computeGuestLookupKey(g.phone, g.passportSeries || "");
      if (!key) return;
      m[key] = {
        name: g.name,
        lastVisit: checkInLabel(g.lastVisit),
        price: g.price,
        notes: g.notes || "",
      };
    });
    return m;
  }, [recentData]);

  const normalizedPhone = (prefill.guestPhone || "").replace(/\D/g, "");

  const [showRecentGuests, setShowRecentGuests] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonValue, setCancelReasonValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Yangi bron uchun: "choose" — Yangi mehmon (scan) yoki Avval kelgan; "form" — to‘liq forma. */
  const [step, setStep] = useState<"choose" | "form">(isEditMode ? "form" : "choose");
  const [notesOpen, setNotesOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<string[]>(() =>
    isEditMode && Array.isArray(prefill.bookingPhotos) ? prefill.bookingPhotos : []
  );
  const [phone, setPhone] = useState(normalizedPhone);
  const [passportSeries, setPassportSeries] = useState(() => prefill.guestPassportSeries || "");
  const [price, setPrice] = useState(() => {
    if (prefill.price) return prefill.price;
    return sessionStorage.getItem("lastPrice") || "";
  });
  const [paid, setPaid] = useState(prefill.paid ?? "");
  const [notes, setNotes] = useState(() => {
    if (prefill.notes) return prefill.notes;
    if (prefill.guestName) return `Mijoz: ${prefill.guestName}`;
    return "";
  });
  const [nights, setNights] = useState(prefill.nights ?? 1);

  const [guests, setGuests] = useState<GuestEntry[]>(() => [createEmptyGuest(1)]);
  const [activeGuestIdx, setActiveGuestIdx] = useState(0);
  const ocrProcessedRef = useRef<Set<string>>(new Set());
  const [idOcrPreview, setIdOcrPreview] = useState<IdOcrPreview | null>(null);
  /** Avval kelgan mehmon qo'llanildi → banner "to'ldirildi" holatiga o'tadi */
  const [appliedRepeatKey, setAppliedRepeatKey] = useState<string>("");

  useEffect(() => {
    if (!isFullRoom) return;
    setIdOcrPreview(null);
  }, [activeGuestIdx, isFullRoom]);

  const currentRepeatKey = isFullRoom
    ? computeGuestLookupKey(guests[activeGuestIdx]?.phone || "", guests[activeGuestIdx]?.passportSeries || "")
    : computeGuestLookupKey(phone, passportSeries);
  const repeatGuest = guestLookup[currentRepeatKey] || null;

  const photoListKey = isFullRoom
    ? `${activeGuestIdx}:${JSON.stringify(guests[activeGuestIdx]?.photos ?? [])}`
    : JSON.stringify(photos);

  useEffect(() => {
    const urls = isFullRoom ? guests[activeGuestIdx]?.photos ?? [] : photos;
    const last = urls[urls.length - 1];
    if (!last || !last.startsWith("data:image")) return;
    if (ocrProcessedRef.current.has(last)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await extractGuestNameFromIdImage(last);
          if (cancelled) return;
          ocrProcessedRef.current.add(last);
          const name = (data.full_name || "").trim();
          const raw = (data.raw_text_preview || "").trim().slice(0, 2500);
          const doc = (data.document_number || "").trim();
          const passFromOcr = normalizePassportSeries(doc);
          const canApplyPassport = passFromOcr.length >= 4;
          if (name || doc || raw) {
            setIdOcrPreview({
              photoDataUrl: last,
              fullName: name,
              documentNumber: doc,
              rawPreview: raw,
            });
          }
          if (name || canApplyPassport) {
            if (isFullRoom) {
              setGuests((prev) => {
                const gi = prev.findIndex((g) => g.photos.includes(last));
                if (gi < 0) return prev;
                return prev.map((g, i) => {
                  if (i !== gi) return g;
                  const updates: Partial<GuestEntry> = {};
                  if (name) updates.notes = applyMijozNameToNotes(g.notes, name);
                  if (canApplyPassport && !normalizePassportSeries(g.passportSeries)) {
                    updates.passportSeries = passFromOcr;
                  }
                  return { ...g, ...updates };
                });
              });
            } else {
              if (name) setNotes((n) => applyMijozNameToNotes(n, name));
              if (canApplyPassport) {
                setPassportSeries((p) => (normalizePassportSeries(p) ? p : passFromOcr));
              }
            }
            const parts: string[] = [];
            if (name) parts.push(`Ism: ${name}`);
            if (canApplyPassport) parts.push(`Seriya: ${passFromOcr}`);
            if (parts.length) toast.success(`Hujjatdan o‘qildi: ${parts.join(" · ")}`);
          } else if (raw) {
            toast.message("Hujjat matni o‘qildi — ism avtomatik aniqlanmadi", { duration: 4500 });
          }
        } catch (e) {
          if (cancelled) return;
          ocrProcessedRef.current.add(last);
          setIdOcrPreview((p) => (p?.photoDataUrl === last ? null : p));
          if (e instanceof ApiError && e.status === 503) {
            toast.message(e.message || "OCR serverda yoqilmagan", { duration: 6000 });
            return;
          }
          const msg = e instanceof ApiError ? e.message : "Hujjatdan ism o‘qilmadi";
          toast.error(msg);
        }
      })();
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // photoListKey = activeGuestIdx + photos (to‘liq xona / bitta karavot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoListKey, isFullRoom]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const hostel = prefill.hostel;
      const roomCode = prefill.roomId;
      if (!hostel || !roomCode) throw new Error("Xona yoki hostel tanlanmagan");

      if (isEditMode) {
        const id = prefill.bookingId;
        if (!id) throw new Error("Bron ID topilmadi — taxtadan qayta oching");
        await patchBooking(id, {
          guestPhone: digitsOnly(phone),
          guestPassportSeries: normalizePassportSeries(passportSeries),
          guestName: prefill.guestName || guestNameFromNotes(notes) || "Mehmon",
          price: price || "0",
          paid: paid || "0",
          notes,
          nights,
          checkInDate: prefill.checkInDate ?? stayDateIso,
          photos,
          checkedInBy: prefill.checkedInBy,
        });
        return;
      }

      if (isFullRoom) {
        const filled = guests.filter((g) => lineHasValidGuestIdentity(g.phone, g.passportSeries));
        if (filled.length === 0) {
          throw new Error("Kamida bitta mehmon: hujjat seriyasi (4+ belgi) kiriting");
        }
        const keys = filled.map((g) => computeGuestLookupKey(g.phone, g.passportSeries));
        if (new Set(keys).size !== keys.length) {
          throw new Error("Bir xil hujjat seriyasi ikki mehmonda takrorlanmasin");
        }
        const beds = prefill.emptyBedIds ?? [];
        if (beds.length < filled.length) throw new Error("Bo'sh karavotlar soni yetarli emas");
        const parentNights = Math.max(1, ...filled.map((g) => g.nights));
        await createBooking({
          hostel,
          roomCode,
          checkInDate: stayDateIso,
          nights: parentNights,
          checkedInBy: prefill.checkedInBy || "",
          lines: filled.map((g, i) => ({
            bedIndex: beds[i],
            guestName: guestNameFromNotes(g.notes) || "Mehmon",
            guestPhone: digitsOnly(g.phone),
            guestPassportSeries: normalizePassportSeries(g.passportSeries),
            price: g.price || "0",
            paid: g.paid || "0",
            notes: g.notes,
            photos: g.photos,
            nights: g.nights,
          })),
        });
        return;
      }

      if (!lineHasValidGuestIdentity(phone, passportSeries)) {
        throw new Error("Hujjat seriyasi (pasport yoki haydovchilik guvohnomasi, 4+ belgi) kiriting");
      }
      if (!prefill.bedId) throw new Error("Karavot tanlanmagan");

      await createBooking({
        hostel,
        roomCode,
        checkInDate: stayDateIso,
        nights,
        checkedInBy: prefill.checkedInBy || "",
        lines: [
          {
            bedIndex: prefill.bedId,
            guestName: prefill.guestName || guestNameFromNotes(notes) || "Mehmon",
            guestPhone: digitsOnly(phone),
            guestPassportSeries: normalizePassportSeries(passportSeries),
            price: price || "0",
            paid: paid || "0",
            notes,
            photos,
          },
        ],
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] });
      void queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      void queryClient.invalidateQueries({ queryKey: ["cleaning"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reasonLabel: string) => {
      const id = prefill.bookingId;
      if (!id) throw new Error("Bron ID topilmadi");
      await deleteBooking(id, reasonLabel);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] });
      void queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      void queryClient.invalidateQueries({ queryKey: ["cleaning"] });
    },
  });

  const handlePhotos = useCallback(
    (files: FileList) => {
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
    },
    [photos.length, isFullRoom, guests, activeGuestIdx]
  );

  const removePhoto = (i: number) => {
    if (isFullRoom) {
      setGuests((prev) =>
        prev.map((g, idx) =>
          idx === activeGuestIdx ? { ...g, photos: g.photos.filter((_, pi) => pi !== i) } : g
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
            idx === activeGuestIdx ? { ...g, photos: g.photos.map((p, pi) => (pi === i ? url : p)) } : g
          )
        );
      } else {
        setPhotos((prev) => prev.map((p, idx) => (idx === i ? url : p)));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoFill = (guest: (typeof guestLookup)[string]) => {
    if (isFullRoom) {
      updateGuest(activeGuestIdx, { price: String(guest.price), notes: guest.notes });
    } else {
      setPrice(String(guest.price));
      setNotes(guest.notes);
    }
    setAppliedRepeatKey(currentRepeatKey);
    toast.success(`${guest.name} ma'lumotlari to'ldirildi`);
  };

  const handleRecentGuestSelect = (guest: RecentGuest) => {
    const guestNotes = guest.notes
      ? guest.notes
      : guest.name
        ? `Mijoz: ${guest.name}`
        : "";
    if (isFullRoom) {
      updateGuest(activeGuestIdx, {
        phone: guest.phone,
        passportSeries: guest.passportSeries || "",
        price: String(guest.price),
        notes: guestNotes,
      });
    } else {
      setPhone(guest.phone);
      setPassportSeries(guest.passportSeries || "");
      setPrice(String(guest.price));
      setNotes(guestNotes);
    }
    setStep("form");
    toast.success(`Mehmon tanlandi: ${guest.name}`);
  };

  const triggerPassportScan = () => {
    photoInputRef.current?.click();
  };

  const handlePassportScanFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handlePhotos(files);
    setStep("form");
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

  const handleSave = async () => {
    if (isEditMode && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      await saveMutation.mutateAsync();
      if (price && !isFullRoom) sessionStorage.setItem("lastPrice", price);
      toast.success(isEditMode ? "O'zgarishlar saqlandi" : "Check-in qilindi");
      setShowConfirm(false);
      if (isFullRoom) {
        setGuests([createEmptyGuest(1)]);
        setActiveGuestIdx(0);
        setIdOcrPreview(null);
      } else {
        setPhone("");
        setPassportSeries("");
        setPaid("");
        setNotes("");
        setPhotos([]);
        setIdOcrPreview(null);
      }
      if (!isEditMode) setStep("choose");
      navigate(-1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xatolik";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const handleConfirmCancelBooking = async () => {
    const reasonLabel = BOOKING_CANCEL_REASONS.find((r) => r.value === cancelReasonValue)?.label;
    if (!reasonLabel || deleting) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(reasonLabel);
      toast.success("Bron bekor qilindi");
      setShowCancelDialog(false);
      setCancelReasonValue("");
      navigate(-1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Xatolik";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyPhone = () => {
    const g = isFullRoom ? guests[activeGuestIdx] : undefined;
    const p = isFullRoom ? g?.phone : phone;
    const pass = isFullRoom ? g?.passportSeries || "" : passportSeries;
    const d = digitsOnly(p || "");
    if (d.length >= 9) {
      void navigator.clipboard.writeText(`+${d}`);
      return;
    }
    const s = normalizePassportSeries(pass);
    if (s) void navigator.clipboard.writeText(s);
  };

  const hostelName = prefill.hostel || "Bron";
  const editCheckInWhen = isEditMode ? formatCheckInDateTime(prefill.checkedInAt) : "";
  const activeGuest = guests[activeGuestIdx];

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
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
              · {prefill.roomName}
              {prefill.bedId ? ` · K${prefill.bedId}` : ""}
            </span>
          )}
        </div>
        {isEditMode && (prefill.checkedInBy || editCheckInWhen) && (
          <p className="text-xs text-muted-foreground mt-1 px-1">
            {prefill.checkedInBy ? (
              <>
                Check-in qilgan: <span className="font-semibold text-foreground">{prefill.checkedInBy}</span>
                {editCheckInWhen ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-foreground">{editCheckInWhen}</span>
                  </>
                ) : null}
              </>
            ) : editCheckInWhen ? (
              <>
                Check-in vaqti: <span className="font-semibold text-foreground">{editCheckInWhen}</span>
              </>
            ) : null}
          </p>
        )}
        {isFullRoom && (
          <p className="text-xs text-muted-foreground mt-1 px-1">
            To'liq xona bron · {guests.length} mehmon
          </p>
        )}
      </div>

      {isFullRoom && (
        <div className="bg-card border-b border-border px-3 py-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            {guests.map((g, idx) => (
              <div
                key={g.id}
                className={`flex items-center gap-0.5 rounded-xl pl-3 pr-1 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                  idx === activeGuestIdx
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <button type="button" onClick={() => setActiveGuestIdx(idx)} className="flex items-center gap-1.5 py-1 pr-1">
                  Mehmon {idx + 1}
                  {(g.phone || g.passportSeries) && (
                    <span className="opacity-70">·{(g.phone || g.passportSeries).slice(-4)}</span>
                  )}
                </button>
                {guests.length > 1 && idx === activeGuestIdx && (
                  <button
                    type="button"
                    aria-label="Mehmonni olib tashlash"
                    onClick={() => removeGuest(idx)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addGuest}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary whitespace-nowrap active:bg-primary/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Qo'shish
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handlePassportScanFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />

        <RecentGuests
          open={showRecentGuests}
          onClose={() => setShowRecentGuests(false)}
          onSelect={(guest) => {
            handleRecentGuestSelect(guest);
            setShowRecentGuests(false);
          }}
        />

        {step === "choose" && !isEditMode ? (
          <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            <button
              type="button"
              onClick={triggerPassportScan}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-base font-bold">Yangi mehmon</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRecentGuests(true)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border text-foreground active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-base font-bold">Avval kelgan</span>
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full text-center text-sm font-semibold text-muted-foreground py-3 hover:text-foreground transition-colors"
            >
              Qo‘lda kiritish
            </button>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-4 py-4 pb-6 space-y-4">
              <PhotoUpload
                hideLabel
                variant={isEditMode ? "default" : "express"}
                photos={isFullRoom ? activeGuest?.photos || [] : photos}
                onAdd={handlePhotos}
                onRemove={removePhoto}
                onReplace={replacePhoto}
              />

              <RepeatGuestBanner
                guest={repeatGuest}
                onApply={handleAutoFill}
                applied={!!repeatGuest && appliedRepeatKey === currentRepeatKey}
              />

              {(() => {
                const urls = isFullRoom ? activeGuest?.photos ?? [] : photos;
                const o = idOcrPreview;
                if (!o || !urls.includes(o.photoDataUrl)) return null;
                if (!o.fullName && !o.documentNumber && !o.rawPreview) return null;
                return (
                  <div className="rounded-xl bg-muted/30 px-3 py-2.5 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Rasmdan</p>
                    {o.fullName ? (
                      <p className="text-sm">
                        <span className="text-muted-foreground font-medium">Ism: </span>
                        <span className="font-semibold text-foreground">{o.fullName}</span>
                      </p>
                    ) : null}
                    {o.documentNumber ? (
                      <p className="text-sm">
                        <span className="text-muted-foreground font-medium">Seriya: </span>
                        <span className="font-mono font-medium text-foreground">{o.documentNumber}</span>
                      </p>
                    ) : null}
                    {o.rawPreview ? (
                      <pre className="text-[10px] leading-snug text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto font-mono rounded-lg bg-muted/40 p-2">
                        {o.rawPreview}
                      </pre>
                    ) : null}
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Hujjat seriyasi</Label>
                <Input
                  value={isFullRoom ? activeGuest?.passportSeries ?? "" : passportSeries}
                  onChange={(e) =>
                    isFullRoom
                      ? updateGuest(activeGuestIdx, { passportSeries: e.target.value.toUpperCase() })
                      : setPassportSeries(e.target.value.toUpperCase())
                  }
                  placeholder="AB1234567"
                  className="h-12 rounded-xl border-border/80 bg-background/50 text-base font-semibold tracking-wide"
                  autoCapitalize="characters"
                />
              </div>

              <PhoneInput
                value={isFullRoom ? activeGuest?.phone || "" : phone}
                onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { phone: v }) : setPhone(v))}
              />

              <PriceInput
                value={isFullRoom ? activeGuest?.price || "" : price}
                onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { price: v }) : setPrice(v))}
                nights={isFullRoom ? activeGuest?.nights || 1 : nights}
                onNightsChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { nights: v }) : setNights(v))}
              />
              <PaymentBlock
                price={isFullRoom ? activeGuest?.price || "" : price}
                paid={isFullRoom ? activeGuest?.paid || "" : paid}
                nights={isFullRoom ? activeGuest?.nights || 1 : nights}
                onPaidChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { paid: v }) : setPaid(v))}
              />

              <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-muted/25 px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground hover:bg-muted/40 transition-colors">
                  <span>Izoh (ixtiyoriy)</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${notesOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden pt-2 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <NotesInput
                    hideLabel
                    value={isFullRoom ? activeGuest?.notes || "" : notes}
                    onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { notes: v }) : setNotes(v))}
                  />
                </CollapsibleContent>
              </Collapsible>
          </div>
        )}
      </div>

      <div
        className="bg-card/95 backdrop-blur border-t border-border px-4 py-3 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {isEditMode && prefill.bookingId && (
          <div className="max-w-lg mx-auto mb-2">
            <button
              type="button"
              onClick={() => {
                setCancelReasonValue("");
                setShowCancelDialog(true);
              }}
              disabled={saving || deleting}
              className="w-full h-11 rounded-xl font-bold text-sm border-2 border-destructive/50 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              Bronni bekor qilish
            </button>
          </div>
        )}
        {step === "choose" && !isEditMode ? (
          <div className="max-w-lg mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="w-full h-14 rounded-xl font-bold text-base bg-muted text-foreground border border-border transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="h-5 w-5" />
              Ortga
            </button>
          </div>
        ) : (
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => (isEditMode ? handleBack() : setStep("choose"))}
              disabled={saving}
              className="h-14 rounded-2xl font-bold text-base bg-muted text-foreground border border-border/80 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
              {isEditMode ? "Ortga" : "Boshqa usul"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-14 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Saqlanmoqda…" : isEditMode ? "O'zgartirish" : "Check-in"}
            </button>
          </div>
        )}
      </div>

      {showCancelDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-booking-title"
        >
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl border border-border animate-fade-in max-h-[90dvh] overflow-y-auto">
            <h2 id="cancel-booking-title" className="text-lg font-extrabold text-foreground mb-1">
              Bronni bekor qilish
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Sababni tanlang, keyin tasdiqlang.</p>
            <RadioGroup value={cancelReasonValue} onValueChange={setCancelReasonValue} className="gap-3 mb-5">
              {BOOKING_CANCEL_REASONS.map((r) => (
                <div key={r.value} className="flex items-start gap-3 rounded-xl border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                  <RadioGroupItem value={r.value} id={`cancel-${r.value}`} className="mt-0.5" />
                  <Label htmlFor={`cancel-${r.value}`} className="text-sm font-medium leading-snug cursor-pointer flex-1">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReasonValue("");
                }}
                disabled={deleting}
                className="h-12 rounded-xl font-bold text-sm bg-muted text-foreground border border-border transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancelBooking()}
                disabled={deleting || !cancelReasonValue}
                className="h-12 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {deleting ? "…" : "Tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="bg-card rounded-2xl mx-6 p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <h2 className="text-lg font-extrabold text-foreground mb-2">O'zgartirishni tasdiqlang</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Mehmon ma'lumotlari o'zgartiriladi. Davom etasizmi?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
                className="h-12 rounded-xl font-bold text-sm bg-muted text-foreground border border-border transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="h-12 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? "…" : "Tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
