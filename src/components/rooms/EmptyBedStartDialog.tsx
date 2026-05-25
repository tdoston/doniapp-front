import React, { useEffect, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import ScrollTimePicker from "@/components/ui/ScrollTimePicker";
import { formatBronArrivalHuman, normalizeExpectedLocal } from "@/lib/bronTime";
import PhoneInput from "@/components/booking/PhoneInput";
import { Input } from "@/components/ui/input";
import { formatNotesWithContactDetails } from "@/lib/bookingNotesContact";
import { cn } from "@/lib/utils";
import { useUiLanguage } from "@/lib/ui-language";

function appendQuickNote(current: string, note: string): string {
  const base = current.trim();
  if (!base) return note;
  if (base.toLowerCase().includes(note.toLowerCase())) return current;
  return `${base}, ${note}`;
}

export type EmptyBedTarget = {
  roomId: string;
  roomName: string;
  bedId: number;
  /** Band bron — menyu: vaqt/izoh + bekor (yangi bron emas) */
  existingBron?: {
    bookingId: string;
    expectedArrival: string;
    notes: string;
  };
};

type Step = "menu" | "bronTime" | "bronNote" | "cancelBron";

interface EmptyBedStartDialogProps {
  context: EmptyBedTarget | null;
  stayDateIso: string;
  onClose: () => void;
  onYangiMehmon: (ctx: EmptyBedTarget) => void;
  onAvvalKelgan: (ctx: EmptyBedTarget) => void;
  /** `expectedArrivalLocal` — `yyyy-MM-ddTHH:mm` (taxta sanasi + tanlangan vaqt) */
  onConfirmBron: (ctx: EmptyBedTarget, expectedArrivalLocal: string, notes: string) => Promise<string>;
  onUpdateBronDraftNote?: (bookingId: string, notes: string) => Promise<void>;
  /** Mavjud bronni taxtadan bekor qilish (`cancelReason` jurnal uchun). */
  onCancelExistingBron?: (bookingId: string, cancelReason: string) => Promise<void>;
  /** `null` — yuklanmoqda; bo'sh massiv — API bo'sh. */
  bronCancelReasons: { value: string; label: string }[] | null;
}

const EmptyBedStartDialog = ({
  context,
  stayDateIso,
  onClose,
  onYangiMehmon,
  onAvvalKelgan,
  onConfirmBron,
  onUpdateBronDraftNote,
  onCancelExistingBron,
  bronCancelReasons,
}: EmptyBedStartDialogProps) => {
  const { t } = useUiLanguage();
  const bronQuickNotes = [
    t("Booking orqali bron", "Бронь через Booking"),
    t("Yana kelmoqchi (kechagi mehmonlar)", "Хочет вернуться (вчерашние гости)"),
  ];
  const [step, setStep] = useState<Step>("menu");
  const [expectedArrivalIso, setExpectedArrivalIso] = useState(() => normalizeExpectedLocal(undefined, stayDateIso));
  const [bronNote, setBronNote] = useState("");
  const [bronPhone, setBronPhone] = useState("");
  const [bronPassport, setBronPassport] = useState("");
  const [cancelReasonValue, setCancelReasonValue] = useState("");
  const [cancelOtherNote, setCancelOtherNote] = useState("");
  const [bronDraftBookingId, setBronDraftBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    setStep("menu");
    setExpectedArrivalIso(normalizeExpectedLocal(undefined, stayDateIso));
    setBronNote("");
    setBronPhone("");
    setBronPassport("");
    setBronDraftBookingId(null);
    setCancelReasonValue("");
    setCancelOtherNote("");
    setErr(null);
    setSubmitting(false);
  }, [context, stayDateIso]);

  const open = Boolean(context);
  const existingBron = context?.existingBron;

  const handleConfirmCancelExistingBron = async () => {
    if (!existingBron?.bookingId || !onCancelExistingBron) return;
    const list = bronCancelReasons ?? [];
    const meta = list.find((r) => r.value === cancelReasonValue);
    if (!meta) return;
    const detail =
      meta.value === "other" && cancelOtherNote.trim()
        ? `${meta.label}: ${cancelOtherNote.trim()}`
        : meta.label;
    const apiReason = `Taxtadan · ${detail}`;
    setErr(null);
    setSubmitting(true);
    try {
      await onCancelExistingBron(existingBron.bookingId, apiReason);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Bekor qilib bo‘lmadi", "Не удалось отменить"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBronFinalSubmit = async () => {
    if (!context) return;
    if (!bronDraftBookingId) {
      setErr(t("Avval vaqtni tasdiqlang", "Сначала подтвердите время"));
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      const combined = formatNotesWithContactDetails(bronNote, bronPhone, bronPassport).slice(0, 2000);
      if (onUpdateBronDraftNote) {
        await onUpdateBronDraftNote(bronDraftBookingId, combined);
      }
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Saqlab bo‘lmadi", "Не удалось сохранить"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[min(100vw-1rem,24rem)] rounded-3xl gap-0 border-border/80 bg-card p-0 overflow-hidden shadow-2xl">
        {step === "menu" && context ? (
          <div className="p-5 sm:p-6">
            <DialogHeader className="text-left space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-extrabold">
                  {context.roomName} · K{context.bedId}
                </DialogTitle>
                {existingBron ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-500/25 text-amber-900 dark:text-amber-100">
                    {t("Bron", "Бронь")}
                  </span>
                ) : null}
              </div>
            </DialogHeader>
            <div className="pt-4 space-y-5">
              <div>
                <p
                  className={cn(
                    "text-[0.6875rem] font-bold text-muted-foreground mb-2 leading-snug",
                    existingBron ? "tracking-tight" : "uppercase tracking-wider"
                  )}
                >
                  {existingBron ? t("Bron bo‘yicha check-in qilish", "Заселить по брони") : t("Check-in", "Заселение")}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onYangiMehmon(context);
                      onClose();
                    }}
                    className="w-full h-14 rounded-2xl bg-primary px-4 text-left text-base font-bold text-primary-foreground active:scale-[0.98]"
                  >
                    {t("Yangi mehmon", "Новый гость")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAvvalKelgan(context)}
                    className="w-full h-14 rounded-2xl border border-border bg-background px-4 text-left text-base font-bold text-foreground active:scale-[0.98] active:bg-muted/50"
                  >
                    {t("Avval kelgan", "Ранее проживал")}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">{t("Bron", "Бронь")}</p>
                {existingBron ? (
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{t("Tashrif", "Визит")}</p>
                      <p className="text-base font-bold tabular-nums text-foreground mt-0.5">
                        {formatBronArrivalHuman(
                          normalizeExpectedLocal(existingBron.expectedArrival, stayDateIso)
                        )}
                      </p>
                    </div>
                    <div className="border-t border-border pt-2">
                      <p className="text-xs font-medium text-muted-foreground">{t("Izoh", "Комментарий")}</p>
                      {existingBron.notes?.trim() ? (
                        <p className="text-sm text-foreground mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap leading-snug">
                          {existingBron.notes.trim()}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">—</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting || !onCancelExistingBron}
                      onClick={() => {
                        setErr(null);
                        setCancelReasonValue("");
                        setCancelOtherNote("");
                        setStep("cancelBron");
                      }}
                      className={cn(
                        "w-full h-10 rounded-lg font-semibold",
                        "border-destructive/45 text-destructive bg-destructive/[0.04]",
                        "hover:bg-destructive/[0.14] hover:border-destructive/70 hover:text-destructive",
                        "hover:shadow-sm active:scale-[0.99] transition-all duration-200"
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("Bronni bekor qilish", "Отменить бронь")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErr(null);
                      setStep("bronTime");
                    }}
                    className="w-full h-14 rounded-2xl border border-amber-600/40 bg-amber-400/90 px-4 text-left text-base font-bold text-amber-950 active:scale-[0.98]"
                  >
                    {t("Bron", "Бронь")}
                  </button>
                )}
              </div>
            </div>
            {err && step === "menu" ? <p className="text-xs font-medium text-destructive mt-3">{err}</p> : null}
          </div>
        ) : null}

        {step === "cancelBron" && context && existingBron ? (
          <div className="p-5 sm:p-6 pb-6">
            <DialogHeader className="text-left space-y-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  setStep("menu");
                  setErr(null);
                  setCancelReasonValue("");
                  setCancelOtherNote("");
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 -ml-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Ortga", "Назад")}
              </button>
              <DialogTitle className="text-lg font-extrabold tracking-tight">{t("Bronni bekor qilish", "Отменить бронь")}</DialogTitle>
              <p className="text-xs font-medium text-muted-foreground leading-snug">
                {t("Karavot bo‘shaydi. Sababni tanlang — keyin tasdiqlang.", "Кровать освободится. Выберите причину и подтвердите.")}
              </p>
            </DialogHeader>
            <RadioGroup value={cancelReasonValue} onValueChange={setCancelReasonValue} className="gap-3 mt-4">
              {bronCancelReasons === null ? (
                <p className="text-sm text-muted-foreground py-2">{t("Sabablari yuklanmoqda…", "Причины загружаются…")}</p>
              ) : (
                bronCancelReasons.map((r) => (
                  <div
                    key={r.value}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={r.value} id={`board-cancel-${r.value}`} className="mt-0.5" />
                    <Label htmlFor={`board-cancel-${r.value}`} className="text-sm font-medium leading-snug cursor-pointer flex-1">
                      {r.label}
                    </Label>
                  </div>
                ))
              )}
            </RadioGroup>
            {cancelReasonValue === "other" ? (
              <Textarea
                value={cancelOtherNote}
                onChange={(e) => setCancelOtherNote(e.target.value)}
                placeholder={t("Batafsil yozing (ixtiyoriy)", "Напишите подробнее (необязательно)")}
                rows={3}
                maxLength={500}
                className="mt-3 rounded-xl border-border/80 bg-background/80 text-sm resize-none"
              />
            ) : null}
            {err ? <p className="text-xs font-medium text-destructive mt-3">{err}</p> : null}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setStep("menu");
                  setErr(null);
                  setCancelReasonValue("");
                  setCancelOtherNote("");
                }}
                className="h-14 rounded-2xl font-bold text-base"
              >
                {t("Bekor qilish", "Отмена")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={submitting || !cancelReasonValue || bronCancelReasons === null || bronCancelReasons.length === 0}
                onClick={() => void handleConfirmCancelExistingBron()}
                className="h-14 rounded-2xl font-bold text-base shadow-md"
              >
                {submitting ? "…" : t("Tasdiqlash", "Подтвердить")}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "bronTime" && context ? (
          <div className="p-5 sm:p-6 pb-6">
            <DialogHeader className="text-left space-y-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  setStep("menu");
                  setErr(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 -ml-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Ortga", "Назад")}
              </button>
              <DialogTitle className="text-lg font-extrabold tracking-tight">{t("Kelish vaqti", "Время прибытия")}</DialogTitle>
              <p className="text-xs font-medium text-muted-foreground leading-snug">
                {t("Mehmon qachon kelishi mumkin? Avval soatni tanlang.", "Когда гость может приехать? Сначала выберите время.")}
              </p>
            </DialogHeader>
            <div className="mt-4">
              <ScrollTimePicker stayDateIso={stayDateIso} value={expectedArrivalIso} onChange={setExpectedArrivalIso} />
            </div>
            {err ? <p className="text-xs font-medium text-destructive mt-2">{err}</p> : null}
            <Button
              type="button"
              className="w-full h-14 mt-5 rounded-2xl font-bold text-base shadow-md active:scale-[0.98]"
              disabled={submitting}
              onClick={async () => {
                if (!context) return;
                const v = expectedArrivalIso.trim();
                if (!v) {
                  setErr(t("Kelish vaqtini tanlang", "Выберите время прибытия"));
                  return;
                }
                setErr(null);
                setSubmitting(true);
                try {
                  const bookingId = await onConfirmBron(context, v, "");
                  setBronDraftBookingId(bookingId);
                  setStep("bronNote");
                } catch (e) {
                  setErr(e instanceof Error ? e.message : t("Bron qilib bo‘lmadi", "Не удалось оформить бронь"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? t("Band qilinmoqda…", "Бронируется…") : t("Davom etish", "Продолжить")}
            </Button>
          </div>
        ) : null}

        {step === "bronNote" && context ? (
          <div className="p-5 sm:p-6 pb-6">
            <DialogHeader className="text-left space-y-1 pb-2">
              <button
                type="button"
                onClick={() => {
                  setStep("bronTime");
                  setErr(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-1 -ml-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Vaqtga qaytish", "Назад ко времени")}
              </button>
              <DialogTitle className="text-lg font-extrabold tracking-tight">{t("Izoh", "Комментарий")}</DialogTitle>
              <p className="text-xs font-medium text-muted-foreground leading-snug">
                {t("Telefon va hujjat izohga qo'shilib saqlanadi (ixtiyoriy).", "Телефон и документ будут добавлены в комментарий (необязательно).")}
              </p>
            </DialogHeader>
            <div className="mt-3 space-y-2">
              <PhoneInput value={bronPhone} onChange={setBronPhone} />
              <div
                className={cn(
                  "flex rounded-xl border border-input bg-background px-3 py-0.5",
                  "shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring"
                )}
              >
                <Input
                  value={bronPassport}
                  onChange={(e) => setBronPassport(e.target.value.toUpperCase())}
                  placeholder={t("Pasport yoki guvohnoma seriyasi", "Серия паспорта или документа")}
                  aria-label={t("Pasport yoki guvohnoma", "Паспорт или документ")}
                  autoCapitalize="characters"
                  className="h-11 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <Textarea
              value={bronNote}
              onChange={(e) => setBronNote(e.target.value)}
              placeholder={t("Masalan: Telegramdan yozgan, kechqurun…", "Например: написал в Telegram, вечером…")}
              rows={4}
              maxLength={500}
              className="mt-3 rounded-2xl border-border/80 bg-background/80 text-sm resize-none min-h-[120px]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {bronQuickNotes.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBronNote((prev) => appendQuickNote(prev, option))}
                  className="h-8 rounded-lg border border-border/70 bg-background px-3 text-xs font-semibold text-foreground/90 active:scale-[0.98]"
                >
                  {option}
                </button>
              ))}
            </div>
            {err ? <p className="text-xs font-medium text-destructive mt-2">{err}</p> : null}
            <Button
              type="button"
              className="w-full h-14 mt-5 rounded-2xl font-bold text-base shadow-md bg-amber-500 text-amber-950 hover:bg-amber-400 active:scale-[0.98]"
              disabled={submitting}
              onClick={() => void handleBronFinalSubmit()}
            >
              {submitting ? t("Saqlanmoqda…", "Сохраняется…") : t("Bronni saqlash", "Сохранить бронь")}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default EmptyBedStartDialog;
