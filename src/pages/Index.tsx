import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, Magnet, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PhotoUpload from "@/components/booking/PhotoUpload";
import PhoneInput from "@/components/booking/PhoneInput";
import PriceInput from "@/components/booking/PriceInput";
import PaymentBlock from "@/components/booking/PaymentBlock";
import NotesInput from "@/components/booking/NotesInput";
import RepeatGuestBanner, { type RepeatGuest } from "@/components/booking/RepeatGuestBanner";
import type { BookingPrefillState } from "@/types/bookingPrefill";
import {
  ApiError,
  createBooking,
  deleteBooking,
  digitsOnly,
  fetchRecentGuests,
  patchBooking,
  parseDocumentPhoto,
  recentGuestsQueryKey,
  type IdentityOverlapWarning,
} from "@/lib/api";
import { computeGuestLookupKey, lineHasValidGuestIdentity, normalizePassportSeries } from "@/lib/guestIdentity";
import { BOOKING_FIELD_SHELL_CLASS, BOOKING_SINGLE_LINE_INPUT_CLASS } from "@/lib/bookingFieldStyles";
import { cn } from "@/lib/utils";
import { checkInLabel } from "@/lib/dates";
import { BOOKING_CANCEL_REASONS } from "@/lib/bookingCancelReasons";
import { formatBronArrivalHuman } from "@/lib/bronTime";
import { bookingSaveErrorUz } from "@/lib/bookingSaveErrorUz";
import {
  formatNotesWithContactDetails,
  parseEmbeddedContactFromNotes,
  stripEmbeddedContactLines,
} from "@/lib/bookingNotesContact";
import { LAST_BOOKING_IDENTITY_OVERLAP_KEY } from "@/lib/identityOverlapWarning";

function guestNameFromNotes(notes: string): string {
  const m = notes.match(/^Mijoz:\s*(.+)$/i);
  return m ? m[1].trim() : "";
}

function applyParsedDocToNotes(current: string, fullName: string, birthDate: string): string {
  const lines = current
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const next = [...lines];
  if (fullName) {
    const hasName = next.some((l) => /^Mijoz:/i.test(l));
    if (!hasName) next.unshift(`Mijoz: ${fullName}`);
  }
  if (birthDate) {
    const hasDob = next.some((l) => /^Tug'ilgan sana:/i.test(l));
    if (!hasDob) next.push(`Tug'ilgan sana: ${birthDate}`);
  }
  return next.join("\n");
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
  const isBronReservation = isEditMode && prefill.bookingKind === "bron";
  const [editUnlocked, setEditUnlocked] = useState(false);
  const fieldsReadOnly = isEditMode && !isBronReservation && !editUnlocked;
  const isCheckInEditLocked = fieldsReadOnly;

  const todayIso = format(new Date(), "yyyy-MM-dd");
  const stayDateIso = prefill.stayDate ?? todayIso;

  const recentLimit = 120;
  const { data: recentData } = useQuery({
    queryKey: recentGuestsQueryKey(recentLimit),
    queryFn: () => fetchRecentGuests(recentLimit),
    staleTime: 60_000,
  });

  const guestLookup = useMemo(() => {
    const m: Record<string, RepeatGuest> = {};
    (recentData?.guests ?? []).forEach((g) => {
      const key = g.lookupKey || computeGuestLookupKey(g.phone, g.passportSeries || "");
      if (!key) return;
      const paidNum = typeof g.paid === "number" ? g.paid : Number(g.paid) || 0;
      const n = g.nights;
      const nightsSnap = typeof n === "number" && n >= 1 ? Math.min(365, n) : 1;
      const photoSnap = (g.photos ?? [])
        .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        .slice(0, 3);
      m[key] = {
        name: g.name || "",
        lastVisit: checkInLabel(g.lastVisit),
        price: g.price,
        paid: paidNum,
        nights: nightsSnap,
        notes: g.notes || "",
        phone: g.phone || "",
        passportSeries: normalizePassportSeries(g.passportSeries || ""),
        hostel: g.hostel,
        room: g.room,
        ...(photoSnap.length ? { photos: photoSnap } : {}),
      };
    });
    return m;
  }, [recentData]);

  const normalizedPhone = (prefill.guestPhone || "").replace(/\D/g, "");
  const notesFromEmbeddedContact =
    isEditMode && prefill.notes ? parseEmbeddedContactFromNotes(prefill.notes) : { phone: "", passportSeries: "" };

  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReasonValue, setCancelReasonValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiExtracted, setAiExtracted] = useState<{ name: string; serialNumber: string; dateOfBirth: string } | null>(null);
  const [aiRawText, setAiRawText] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [photos, setPhotos] = useState<string[]>(() => {
    const raw = prefill.bookingPhotos;
    if (Array.isArray(raw)) {
      if (raw.length > 0) {
        return raw.filter((u): u is string => typeof u === "string").slice(0, 3);
      }
      if (isEditMode) return raw;
    }
    return [];
  });
  const [phone, setPhone] = useState(() =>
    normalizedPhone.length >= 9
      ? normalizedPhone
      : notesFromEmbeddedContact.phone.length > 0
        ? notesFromEmbeddedContact.phone
        : normalizedPhone
  );
  const [passportSeries, setPassportSeries] = useState(() => {
    const fromNotes = notesFromEmbeddedContact.passportSeries;
    if (fromNotes.length > 0) return fromNotes;
    return prefill.guestPassportSeries || "";
  });
  const [price, setPrice] = useState(() => {
    if (prefill.price) return prefill.price;
    return sessionStorage.getItem("lastPrice") || "";
  });
  const [paid, setPaid] = useState(prefill.paid ?? "");
  const [notes, setNotes] = useState(() => {
    if (isEditMode && prefill.notes) return stripEmbeddedContactLines(prefill.notes);
    return "";
  });
  const [nights, setNights] = useState(prefill.nights ?? 1);

  const [guests, setGuests] = useState<GuestEntry[]>(() => [createEmptyGuest(1)]);
  const [activeGuestIdx, setActiveGuestIdx] = useState(0);
  /** Avval kelgan mehmon qo'llanildi → banner "to'ldirildi" holatiga o'tadi */
  const [appliedRepeatKey, setAppliedRepeatKey] = useState<string>("");

  const repeatLookupKey = useMemo(
    () =>
      isFullRoom
        ? computeGuestLookupKey(guests[activeGuestIdx]?.phone || "", guests[activeGuestIdx]?.passportSeries || "")
        : computeGuestLookupKey(phone, passportSeries),
    [isFullRoom, phone, passportSeries, activeGuestIdx, guests]
  );

  const repeatGuest: RepeatGuest | null = repeatLookupKey ? guestLookup[repeatLookupKey] ?? null : null;

  /** CRM dan tanlab kelganda — «tanlash» banneri emas, darhol «tanlandi» holati */
  const repeatGuestListPrefillAppliedRef = useRef(false);
  useEffect(() => {
    if (isEditMode || isFullRoom || !prefill.fromRecentGuestList) return;
    if (repeatGuestListPrefillAppliedRef.current) return;
    const key = repeatLookupKey;
    if (!key || !repeatGuest) return;
    repeatGuestListPrefillAppliedRef.current = true;
    setAppliedRepeatKey(key);
  }, [isEditMode, isFullRoom, prefill.fromRecentGuestList, repeatLookupKey, repeatGuest]);

  useEffect(() => {
    setEditUnlocked(false);
  }, [prefill.bookingId, prefill.mode]);

  const crmRefreshForKey = useRef<string | null>(null);
  useEffect(() => {
    if (!repeatLookupKey || !repeatGuest) {
      crmRefreshForKey.current = null;
      return;
    }
    if (crmRefreshForKey.current === repeatLookupKey) return;
    crmRefreshForKey.current = repeatLookupKey;
    void queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
  }, [repeatLookupKey, repeatGuest, queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (): Promise<{
      identityOverlapWarnings?: IdentityOverlapWarning[];
      identityOverlapWarning?: IdentityOverlapWarning;
    }> => {
      const hostel = prefill.hostel;
      const roomCode = prefill.roomId;
      if (!hostel || !roomCode) throw new Error("Xona yoki hostel tanlanmagan");

      if (isEditMode) {
        const id = prefill.bookingId;
        if (!id) throw new Error("Bron ID topilmadi — taxtadan qayta oching");
        if (prefill.bookingKind === "bron") {
          if (!lineHasValidGuestIdentity(phone, passportSeries)) {
            throw new Error("Check-in uchun hujjat seriyasi (4+ belgi) yoki telefon (9+ raqam) kiriting");
          }
          const pn = normalizePassportSeries(passportSeries);
          if (pn.startsWith("BRON")) {
            throw new Error("Haqiqiy pasport yoki haydovchilik guvohnomasi seriyasini kiriting");
          }
        }
        const resolvedGuestName =
          prefill.bookingKind === "bron"
            ? guestNameFromNotes(notes) || "Mehmon"
            : (guestNameFromNotes(notes) || prefill.guestName || "").trim();
        const identityPatch = lineHasValidGuestIdentity(phone, passportSeries)
          ? {
              guestPhone: digitsOnly(phone),
              guestPassportSeries: normalizePassportSeries(passportSeries),
            }
          : {};
        const notesOut = formatNotesWithContactDetails(notes, phone, passportSeries);
        const res = await patchBooking(id, {
          ...identityPatch,
          guestName: resolvedGuestName,
          price: price || "0",
          paid: paid || "0",
          notes: notesOut,
          nights,
          checkInDate: prefill.checkInDate ?? stayDateIso,
          photos,
          checkedInBy: prefill.checkedInBy,
          ...(prefill.bookingKind === "bron" ? { bookingKind: "check_in" as const } : {}),
        });
        return { identityOverlapWarning: res.identityOverlapWarning };
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
        const res = await createBooking({
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
            notes: formatNotesWithContactDetails(g.notes, g.phone, g.passportSeries),
            photos: g.photos,
            nights: g.nights,
          })),
        });
        return { identityOverlapWarnings: res.identityOverlapWarnings };
      }

      if (!prefill.bedId) throw new Error("Karavot tanlanmagan");

      const notesOut = formatNotesWithContactDetails(notes, phone, passportSeries);
      const res = await createBooking({
        hostel,
        roomCode,
        checkInDate: stayDateIso,
        nights,
        checkedInBy: prefill.checkedInBy || "",
        lines: [
          {
            bedIndex: prefill.bedId,
            guestName: (prefill.guestName || guestNameFromNotes(notesOut) || "").trim(),
            guestPhone: digitsOnly(phone),
            guestPassportSeries: normalizePassportSeries(passportSeries),
            price: price || "0",
            paid: paid || "0",
            nights,
            notes: notesOut,
            photos,
          },
        ],
      });
      return { identityOverlapWarnings: res.identityOverlapWarnings };
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

  const handleAutoFill = (guest: RepeatGuest) => {
    const priceNum = Math.round(Number(guest.price)) || 0;
    const priceStr = String(priceNum);
    const paidStr = guest.paid > 0 ? String(Math.round(Number(guest.paid))) : "0";
    const snapPhotos = (guest.photos ?? [])
      .filter((u) => typeof u === "string" && u.trim().length > 0)
      .slice(0, 3);

    const snapNights =
      typeof guest.nights === "number" && guest.nights >= 1 ? Math.min(365, guest.nights) : null;
    if (isFullRoom) {
      const cur = guests[activeGuestIdx];
      updateGuest(activeGuestIdx, {
        phone: guest.phone || cur?.phone || "",
        passportSeries: guest.passportSeries
          ? normalizePassportSeries(guest.passportSeries)
          : cur?.passportSeries || "",
        ...(priceNum > 0 ? { price: priceStr } : {}),
        paid: paidStr,
        ...(snapNights != null ? { nights: snapNights } : {}),
        ...(snapPhotos.length ? { photos: snapPhotos } : {}),
      });
    } else {
      if (guest.phone) setPhone(guest.phone);
      if (guest.passportSeries) setPassportSeries(normalizePassportSeries(guest.passportSeries));
      if (priceNum > 0) setPrice(priceStr);
      setPaid(paidStr);
      if (snapNights != null) setNights(snapNights);
      if (snapPhotos.length) setPhotos(snapPhotos);
    }
    setAppliedRepeatKey(repeatLookupKey);
  };

  const handleParseFromPhoto = async () => {
    const firstPhoto = isFullRoom ? activeGuest?.photos?.[0] : photos[0];
    if (!firstPhoto) {
      setSaveError("Avval hujjat rasmini yuklang, keyin AI tugmasini bosing.");
      return;
    }
    setAiParsing(true);
    setSaveError(null);
    setAiExtracted(null);
    setAiRawText("");
    try {
      const parsed = await parseDocumentPhoto(firstPhoto);
      const rawText = (parsed.rawExtractedText || "").trim();
      if (rawText) {
        setAiRawText(rawText);
        console.log("AI raw extracted text:", rawText);
      }
      if (!parsed.parsed) {
        setSaveError(
          rawText
            ? "AI javobi olindi, lekin structured parse bo'lmadi. Pastda raw text ko'rsatilgan."
            : "Rasmdan hujjat maʼlumotlari o‘qilmadi. Tiniqroq rasm bilan qayta urinib ko‘ring."
        );
        return;
      }
      const docNumber = normalizePassportSeries(parsed.documentNumber || "");
      const fullName = (parsed.fullName || "").trim();
      const birthDate = (parsed.birthDate || "").trim();
      setAiExtracted({
        name: fullName,
        serialNumber: docNumber,
        dateOfBirth: birthDate,
      });
      if (docNumber) {
        if (isFullRoom) updateGuest(activeGuestIdx, { passportSeries: docNumber });
        else setPassportSeries(docNumber);
      }
      if (isFullRoom) {
        const cur = activeGuest?.notes || "";
        updateGuest(activeGuestIdx, { notes: applyParsedDocToNotes(cur, fullName, birthDate) });
      } else {
        setNotes((prev) => applyParsedDocToNotes(prev, fullName, birthDate));
      }
    } catch (e) {
      const raw = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "AI parse xatosi";
      setSaveError(raw);
    } finally {
      setAiParsing(false);
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

  const handleSave = async () => {
    if (isEditMode && isBronReservation && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    if (saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      const saveResult = await saveMutation.mutateAsync();
      const overlapList: IdentityOverlapWarning[] = [
        ...(saveResult.identityOverlapWarnings ?? []),
        ...(saveResult.identityOverlapWarning ? [saveResult.identityOverlapWarning] : []),
      ];
      if (overlapList.length > 0) {
        try {
          sessionStorage.setItem(LAST_BOOKING_IDENTITY_OVERLAP_KEY, JSON.stringify(overlapList));
        } catch {
          void 0;
        }
      }
      if (price && !isFullRoom) sessionStorage.setItem("lastPrice", price);
      setShowConfirm(false);
      setEditUnlocked(false);
      if (isFullRoom) {
        setGuests([createEmptyGuest(1)]);
        setActiveGuestIdx(0);
      } else {
        setPhone("");
        setPassportSeries("");
        setPaid("");
        setNotes("");
        setPhotos([]);
      }
      navigate(-1);
    } catch (e) {
      const raw =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Check-inni saqlab bo‘lmadi";
      setSaveError(bookingSaveErrorUz(raw));
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
      setShowCancelDialog(false);
      setCancelReasonValue("");
      navigate(-1);
    } catch {
      void 0;
    } finally {
      setDeleting(false);
    }
  };

  const hostelName = prefill.hostel || "Bron";
  const activeGuest = guests[activeGuestIdx];

  /** To‘g‘ridan-to‘g‘ri `/booking` URL — taxta state siz */
  const bookingContextIncomplete = useMemo(() => {
    if (isEditMode) return false;
    if (!prefill.hostel || !prefill.roomId) return true;
    if (isFullRoom) return !(Array.isArray(prefill.emptyBedIds) && prefill.emptyBedIds.length > 0);
    return prefill.bedId == null;
  }, [isEditMode, isFullRoom, prefill.hostel, prefill.roomId, prefill.bedId, prefill.emptyBedIds]);

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
          <h1 className="text-[1.125rem] sm:text-xl font-extrabold tracking-tight text-primary">{hostelName}</h1>
          {isEditMode && isBronReservation ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-500/25 text-orange-800 dark:text-orange-200">
              Bron
            </span>
          ) : null}
          {prefill.roomName && (
            <span className="text-xs text-muted-foreground">
              · {prefill.roomName}
              {prefill.bedId ? ` · K${prefill.bedId}` : ""}
            </span>
          )}
        </div>
        {isBronReservation && (prefill.expectedArrival || "").trim() ? (
          <p className="text-xs text-foreground/80 mt-1 px-1 tabular-nums">
            {formatBronArrivalHuman(prefill.expectedArrival || "")}
          </p>
        ) : null}
      </div>

      {!isEditMode && bookingContextIncomplete && (
        <div className="bg-amber-500/15 border-b border-amber-500/25 px-4 py-3 shrink-0 text-sm">
          <p className="font-semibold text-foreground">Taxtadan xona va karavot tanlanmagan</p>
          <Link
            to="/"
            className="mt-2 inline-block text-sm font-bold text-primary underline underline-offset-[3px]"
          >
            Taxtaga o‘tish
          </Link>
        </div>
      )}

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
                {guests.length > 1 && idx === activeGuestIdx && !fieldsReadOnly && (
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
              disabled={fieldsReadOnly}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary whitespace-nowrap active:bg-primary/20 disabled:opacity-40"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Qo'shish
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-32 pt-4">
          <div className="flex flex-col gap-4">
            <PhoneInput
              value={isFullRoom ? activeGuest?.phone || "" : phone}
              onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { phone: v }) : setPhone(v))}
              disabled={fieldsReadOnly}
            />
            <div className="flex items-center gap-2">
              <div className={cn(BOOKING_FIELD_SHELL_CLASS, "min-w-0 flex-1", fieldsReadOnly && "pointer-events-none opacity-60")}>
                <Input
                  value={isFullRoom ? activeGuest?.passportSeries ?? "" : passportSeries}
                  onChange={(e) =>
                    isFullRoom
                      ? updateGuest(activeGuestIdx, { passportSeries: e.target.value.toUpperCase() })
                      : setPassportSeries(e.target.value.toUpperCase())
                  }
                  placeholder="Pasport yoki guvohnoma seriyasi"
                  aria-label="Hujjat seriyasi"
                  readOnly={fieldsReadOnly}
                  disabled={fieldsReadOnly}
                  className={BOOKING_SINGLE_LINE_INPUT_CLASS}
                  autoCapitalize="characters"
                />
              </div>
              {!fieldsReadOnly ? (
                <button
                  type="button"
                  onClick={() => void handleParseFromPhoto()}
                  disabled={aiParsing}
                  title="Rasmdan AI orqali parse qilish"
                  aria-label="Rasmdan AI orqali parse qilish"
                  className="relative h-12 w-12 rounded-xl border border-primary/35 bg-primary/10 text-primary shadow-sm transition-all hover:bg-primary/20 active:scale-[0.97] shrink-0 disabled:opacity-50 inline-flex items-center justify-center overflow-hidden"
                >
                  {aiParsing ? (
                    <>
                      <span className="absolute h-5 w-5 rounded-full border border-primary/40 animate-ping" />
                      <span className="absolute h-8 w-8 rounded-full border border-primary/25 animate-ping [animation-delay:220ms]" />
                    </>
                  ) : null}
                  <Magnet className={cn("relative z-10 h-4 w-4", aiParsing && "animate-magnet-shake")} />
                </button>
              ) : null}
            </div>
            {aiExtracted ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
                <p className="font-bold text-primary mb-1">AI parse natijasi</p>
                <p>
                  <span className="font-semibold">Name:</span> {aiExtracted.name || "—"}
                </p>
                <p>
                  <span className="font-semibold">Serial number:</span> {aiExtracted.serialNumber || "—"}
                </p>
                <p>
                  <span className="font-semibold">Date of birth:</span> {aiExtracted.dateOfBirth || "—"}
                </p>
              </div>
            ) : null}
            {aiRawText ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-xs">
                <p className="font-bold text-muted-foreground mb-1">AI raw extracted text (log)</p>
                <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">{aiRawText}</pre>
              </div>
            ) : null}
            {!fieldsReadOnly ? (
              <RepeatGuestBanner
                guest={repeatGuest}
                onApply={handleAutoFill}
                applied={!!repeatGuest && appliedRepeatKey === repeatLookupKey}
              />
            ) : null}
            <PhotoUpload
              variant="default"
              readOnly={fieldsReadOnly}
              photos={isFullRoom ? activeGuest?.photos || [] : photos}
              onAdd={handlePhotos}
              onRemove={removePhoto}
              onReplace={replacePhoto}
            />
          </div>

          <div className="flex flex-col gap-4">
            <PriceInput
              value={isFullRoom ? activeGuest?.price || "" : price}
              onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { price: v }) : setPrice(v))}
              nights={isFullRoom ? activeGuest?.nights || 1 : nights}
              onNightsChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { nights: v }) : setNights(v))}
              disabled={fieldsReadOnly}
            />
            <PaymentBlock
              price={isFullRoom ? activeGuest?.price || "" : price}
              paid={isFullRoom ? activeGuest?.paid || "" : paid}
              nights={isFullRoom ? activeGuest?.nights || 1 : nights}
              onPaidChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { paid: v }) : setPaid(v))}
              disabled={fieldsReadOnly}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">
              Izoh
            </Label>
            <NotesInput
              hideLabel
              disabled={fieldsReadOnly}
              value={isFullRoom ? activeGuest?.notes || "" : notes}
              onChange={(v) => (isFullRoom ? updateGuest(activeGuestIdx, { notes: v }) : setNotes(v))}
            />
          </div>
        </div>
      </div>

      <div
        className="bg-card/95 backdrop-blur border-t border-border px-4 py-3 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {saveError ? (
          <div className="max-w-lg mx-auto mb-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p className="font-semibold leading-snug">{saveError}</p>
          </div>
        ) : null}
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
              {isBronReservation ? "Bronni bekor qilish" : "Check-inni bekor qilish"}
            </button>
          </div>
        )}
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="h-14 rounded-2xl font-bold text-base bg-muted text-foreground border border-border/80 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          {isCheckInEditLocked ? (
            <button
              type="button"
              onClick={() => setEditUnlocked(true)}
              disabled={saving}
              className="h-14 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              O&apos;zgartirish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-14 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving
                ? "Saqlanmoqda…"
                : isBronReservation
                  ? "Check-in qilish"
                  : isEditMode
                    ? "Saqlash"
                    : "Check-in"}
            </button>
          )}
        </div>
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
            <h2 id="cancel-booking-title" className="text-lg font-extrabold text-foreground mb-4">
              {isBronReservation ? "Bronni bekor qilish" : "Check-inni bekor qilish"}
            </h2>
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

      {showConfirm && isBronReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="bg-card rounded-2xl mx-6 p-6 w-full max-w-sm shadow-xl animate-fade-in">
            <h2 className="text-lg font-extrabold text-foreground mb-5">Check-inni tasdiqlang</h2>
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
