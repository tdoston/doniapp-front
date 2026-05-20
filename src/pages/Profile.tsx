import React, { useEffect, useRef, useState } from "react";
import { LogOut, Briefcase, BookUser, ShieldCheck, Camera, Loader2, UserRound, Pencil, Check, X, Trash2 } from "lucide-react";
import { patchMe, type AuthUserDto } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StaffUsersList, type RoleId } from "@/pages/StaffUsers";
import { BOOKING_FIELD_SHELL_CLASS } from "@/lib/bookingFieldStyles";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ProfileRole = AuthUserDto["role"];

const ROLE_META: Record<
  ProfileRole,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    pill: string;
    desc: string;
  }
> = {
  super_admin: {
    label: "Super Admin",
    icon: ShieldCheck,
    pill: "bg-orange-500/25 text-orange-900 dark:text-orange-100 border-orange-500/35",
    desc: "Tizimga to'liq kirish, jamoa boshqaruvi",
  },
  admin: {
    label: "Menedjer",
    icon: Briefcase,
    pill: "bg-secondary text-muted-foreground border-border",
    desc: "Tizim, pul va xodim boshqaruvi",
  },
  staff: {
    label: "Administrator",
    icon: BookUser,
    pill: "bg-secondary text-muted-foreground border-border",
    desc: "Mehmonlarni qabul qiladi va joylashtiradi",
  },
};

async function fileToCompressedDataUrl(file: File, maxSize = 384, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas mavjud emas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) {
          reject(e instanceof Error ? e : new Error("Rasmni siqib bo'lmadi"));
        }
      };
      img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.readAsDataURL(file);
  });
}

type ProfilePageProps = {
  me: AuthUserDto;
  onLogout: () => void;
  onMeUpdate: (next: AuthUserDto) => void;
};

const ProfilePage = ({ me, onLogout, onMeUpdate }: ProfilePageProps) => {
  const meta = ROLE_META[me.role] ?? ROLE_META.staff;
  const RoleIcon = meta.icon;
  const isSuperAdmin = me.role === "super_admin";
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(me.display_name || "");
  const [error, setError] = useState<string>("");
  const avatarUrl = me.avatar_url || "";
  const trimDraftName = draftName.trim();
  const hasNameChanges = trimDraftName.length > 0 && trimDraftName !== (me.display_name || "");

  useEffect(() => {
    if (!profileEditOpen) setDraftName(me.display_name || "");
  }, [me.display_name, profileEditOpen]);

  const onPickFile = () => {
    if (busy) return;
    setError("");
    fileRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayli yuboring");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Rasm 8 MB dan oshmasin");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      const res = await patchMe({ avatar_url: dataUrl });
      onMeUpdate(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rasm yuklab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const onRemoveAvatar = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await patchMe({ avatar_url: "" });
      onMeUpdate(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const onStartNameEdit = () => {
    setError("");
    setDraftName(me.display_name || "");
    setProfileEditOpen(true);
  };

  const onCancelNameEdit = () => {
    if (nameBusy) return;
    setDraftName(me.display_name || "");
    setProfileEditOpen(false);
  };

  const onSaveName = async () => {
    if (nameBusy) return;
    if (!trimDraftName) {
      setError("Ism bo'sh bo'lmasin");
      return;
    }
    if (!hasNameChanges) {
      setProfileEditOpen(false);
      return;
    }
    setNameBusy(true);
    setError("");
    try {
      const res = await patchMe({ display_name: trimDraftName });
      onMeUpdate(res.user);
      setProfileEditOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismni saqlab bo'lmadi");
    } finally {
      setNameBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-4 pb-8">
      <div>
        <Label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">Profil</Label>
        <div
          className={cn(BOOKING_FIELD_SHELL_CLASS, "mt-2 cursor-pointer p-4 active:scale-[0.995]")}
          onClick={onStartNameEdit}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onStartNameEdit();
          }}
          aria-label="Profilni tahrirlash"
        >
          <div className="flex flex-wrap items-start gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPickFile();
              }}
              disabled={busy}
              aria-label="Avatar yuklash"
              className={cn(
                "group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/40 outline-none ring-1 ring-black/[0.06] transition-all",
                "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none",
              )}
            >
              <Avatar className="h-full w-full rounded-xl">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={me.display_name || "Avatar"} className="object-cover" /> : null}
                <AvatarFallback className="rounded-xl bg-muted/80 text-muted-foreground">
                  <UserRound className="mx-auto h-9 w-9 opacity-80" strokeWidth={1.35} aria-hidden />
                  <span className="sr-only">{me.display_name ? `${me.display_name} — profil rasmi` : "Profil rasmi yo'q"}</span>
                </AvatarFallback>
              </Avatar>
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-[1.125rem] sm:text-xl font-extrabold tracking-tight text-primary leading-tight truncate">
                    {me.display_name || "Foydalanuvchi"}
                  </h1>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
                      meta.pill,
                    )}
                  >
                    <RoleIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                    {meta.label}
                  </span>
                </div>
              </div>
              {avatarUrl && !busy ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAvatar();
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/35 bg-destructive/5 px-3 text-xs font-extrabold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Rasmni olib tashlash
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p className="font-semibold leading-snug">{error}</p>
        </div>
      ) : null}

      <Dialog open={profileEditOpen} onOpenChange={setProfileEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profilni tahrirlash</DialogTitle>
            <DialogDescription>Jamoa userlarini tahrirlash oynasiga o'xshash.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Profil rasmi</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onPickFile}
                  disabled={busy}
                  className="group relative h-16 w-16 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-black/[0.06] transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <Avatar className="h-full w-full rounded-xl">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={me.display_name || "Avatar"} className="object-cover" /> : null}
                    <AvatarFallback className="rounded-xl bg-muted/80 text-muted-foreground">
                      <UserRound className="h-8 w-8 opacity-80" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </span>
                </button>
                {avatarUrl && !busy ? (
                  <button
                    type="button"
                    onClick={onRemoveAvatar}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/35 bg-destructive/5 px-3 text-xs font-extrabold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Rasmni olib tashlash
                  </button>
                ) : null}
              </div>
            </div>
            <div>
              <Label className="text-xs">Ism</Label>
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Ismingiz"
                maxLength={120}
                disabled={nameBusy}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancelNameEdit}
                disabled={nameBusy}
                className="inline-flex h-14 items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-muted font-bold text-base text-foreground transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Bekor
              </button>
              <button
                type="button"
                onClick={() => void onSaveName()}
                disabled={nameBusy || !trimDraftName}
                className="inline-flex h-14 items-center justify-center gap-1.5 rounded-2xl bg-primary font-bold text-base text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {nameBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {nameBusy ? "Saqlanmoqda…" : "Saqlash"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-xl border-2 border-destructive/50 bg-destructive/5 px-4 py-3 text-left transition-all hover:bg-destructive/10 active:scale-[0.99] disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/35 bg-background text-destructive">
            <LogOut className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-destructive">Chiqish</p>
            <p className="text-xs font-medium text-muted-foreground">Sessiyani yakunlash</p>
          </div>
        </div>
      </button>

      {isSuperAdmin ? (
        <div className="flex flex-col gap-2">
          <Label className="text-[0.8125rem] font-semibold leading-none text-foreground tracking-tight">Jamoa</Label>
          <p className="text-sm font-medium text-muted-foreground">Userlar, rollar va kirish holatini boshqaring</p>
          <StaffUsersList heading={false} />
        </div>
      ) : null}
    </div>
  );
};

export default ProfilePage;

// Re-export for type compatibility (used by older imports in some callers)
export type { RoleId };
