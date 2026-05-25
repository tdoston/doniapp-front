import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Pencil,
  Briefcase,
  BookUser,
  Send,
  Lock,
  Camera,
  Loader2,
  UserRound,
} from "lucide-react";
import {
  createUser,
  deactivateUser,
  fetchUsers,
  patchUser,
  type StaffUserDto,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUiLanguage } from "@/lib/ui-language";

/** Guest booking form (Index) sticky footer — same visual language for dialog actions */
const bookingFormActionRow = "grid grid-cols-2 gap-3 w-full";
const bookingFormBtnSecondary =
  "inline-flex h-14 w-full items-center justify-center rounded-2xl border border-border/80 bg-muted font-bold text-base text-foreground transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const bookingFormBtnPrimary =
  "inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-bold text-base text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

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

export type RoleId = "admin" | "staff";

const ROLE_META: Record<RoleId, { label: string; icon: React.ComponentType<{ className?: string }>; chip: string }> = {
  admin: {
    label: "Menedjer",
    icon: Briefcase,
    chip: "bg-primary/15 text-primary border-primary/20",
  },
  staff: {
    label: "Administrator",
    icon: BookUser,
    chip: "bg-secondary text-secondary-foreground border-border",
  },
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Simple staff list — usable as a standalone page or embedded in Profile.
 */
export function StaffUsersList({ heading = true }: { heading?: boolean } = {}) {
  const { t } = useUiLanguage();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 20_000,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUserDto | null>(null);

  const users = (data?.users ?? []).slice().sort(
    (a, b) => Number(b.active) - Number(a.active) || a.display_name.localeCompare(b.display_name),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {heading ? (
          <div>
            <h2 className="text-base font-extrabold leading-tight">{t("Jamoa boshqaruvi", "Управление командой")}</h2>
            <p className="text-[11px] text-muted-foreground">{t("Jamoa va ruxsatlar", "Команда и права доступа")}</p>
          </div>
        ) : <span />}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-1.5">
              <UserPlus className="h-4 w-4" />
              {t("Qo'shish", "Добавить")}
            </Button>
          </DialogTrigger>
          <CreateUserDialog
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              void invalidate();
            }}
          />
        </Dialog>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
          <p className="text-sm font-bold text-destructive">{t("Ma'lumot olinmadi", "Не удалось загрузить данные")}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            {t("Qayta urinish", "Повторить")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Users className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">{t("Foydalanuvchi yo'q", "Пользователей нет")}</p>
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {users.map((u) => (
            <UserRow key={u.id} user={u} onEdit={() => setEditing(u)} />
          ))}
        </ul>
      )}

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void invalidate();
        }}
      />
    </div>
  );
}

function UserRow({
  user,
  onEdit,
}: {
  user: StaffUserDto;
  onEdit: () => void;
}) {
  const role = ROLE_META[(user.role as RoleId)] ?? ROLE_META.staff;
  const RoleIcon = role.icon;
  const isTelegram = (user.auth_provider || "password") === "telegram";

  return (
    <li className={`flex items-center gap-3 px-3 py-3 ${user.active ? "" : "bg-muted/30"}`}>
      <Avatar className="h-10 w-10 rounded-xl ring-1 ring-black/[0.06]">
        {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover" /> : null}
        <AvatarFallback className="rounded-xl bg-muted/80 text-muted-foreground">
          <UserRound className="h-5 w-5 opacity-80" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight">{user.display_name}</p>
        <p className="truncate text-[11px] text-muted-foreground mt-0.5">@{user.login}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge
            variant="outline"
            className={`h-5 px-1.5 text-[10px] gap-1 ${
              user.active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${user.active ? "bg-emerald-500" : "bg-muted-foreground"}`}
              aria-hidden
            />
            {user.active ? "Faol" : "Nofaol"}
          </Badge>
          <Badge variant="outline" className={`h-5 px-1.5 text-[10px] gap-1 ${role.chip}`}>
            <RoleIcon className="h-3 w-3" />
            {role.label}
          </Badge>
          <Badge
            variant="outline"
            className={`h-5 px-1.5 text-[10px] gap-1 ${
              isTelegram
                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
                : "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25"
            }`}
          >
            {isTelegram ? <Send className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isTelegram ? "Telegram" : "Login/Parol"}
          </Badge>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 active:scale-[0.96]"
        onClick={onEdit}
        aria-label="Tahrirlash"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </li>
  );
}

function CreateUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleId>("staff");

  const createMut = useMutation({
    mutationFn: () =>
      createUser({
        login: login.trim(),
        display_name: displayName.trim(),
        password,
        role,
      }),
    onSuccess: () => {
      setLogin("");
      setDisplayName("");
      setPassword("");
      setRole("staff");
      onCreated();
    },
  });

  const valid = login.trim().length >= 2 && displayName.trim().length >= 2 && password.length >= 6;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Yangi foydalanuvchi
        </DialogTitle>
        <DialogDescription>Jamoaga yangi a'zo qo'shing va unga rol bering.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Ism</Label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Masalan: Ali Valiyev"
          />
        </div>
        <div>
          <Label className="text-xs">Login</Label>
          <Input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="masalan: ali"
            autoCapitalize="none"
          />
        </div>
        <div>
          <Label className="text-xs">Parol</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi"
          />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Rol</Label>
          <RolePicker value={role} onChange={setRole} />
        </div>
      </div>
      <div className={bookingFormActionRow}>
        <button type="button" className={bookingFormBtnSecondary} onClick={onClose}>
          Bekor
        </button>
        <button
          type="button"
          className={bookingFormBtnPrimary}
          disabled={!valid || createMut.isPending}
          onClick={() => createMut.mutate()}
        >
          {createMut.isPending ? "Saqlanmoqda…" : "Qo'shish"}
        </button>
      </div>
    </DialogContent>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: StaffUserDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<RoleId>("staff");
  const [active, setActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const isTelegram = (user?.auth_provider || "password") === "telegram";

  React.useEffect(() => {
    if (user) {
      setLogin(user.login);
      setDisplayName(user.display_name);
      setRole((user.role as RoleId) ?? "staff");
      setActive(user.active);
      setNewPassword("");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const body: Parameters<typeof patchUser>[1] = {};
      const trimmedLogin = login.trim().toLowerCase();
      if (!isTelegram && trimmedLogin && trimmedLogin !== user.login) body.login = trimmedLogin;
      if (displayName.trim() && displayName !== user.display_name) body.display_name = displayName.trim();
      if (role !== user.role) body.role = role;
      if (active !== user.active) body.active = active;
      if (!isTelegram && newPassword.length >= 6) body.password = newPassword;
      if (Object.keys(body).length === 0) return;
      await patchUser(user.id, body);
    },
    onSuccess: onSaved,
  });

  const passwordInvalid = newPassword.length > 0 && newPassword.length < 6;
  const onPickAvatar = () => {
    if (avatarBusy) return;
    fileRef.current?.click();
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!user || !file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      await patchUser(user.id, { avatar_url: dataUrl });
      setAvatarUrl(dataUrl);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } finally {
      setAvatarBusy(false);
    }
  };

  const onRemoveAvatar = async () => {
    if (!user || avatarBusy) return;
    setAvatarBusy(true);
    try {
      await patchUser(user.id, { avatar_url: "" });
      setAvatarUrl("");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle>Tahrirlash</DialogTitle>
              <DialogDescription>{user.display_name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Profil rasmi</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onPickAvatar}
                    disabled={avatarBusy}
                    className="group relative h-16 w-16 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-black/[0.06] transition-all hover:border-primary/40 active:scale-[0.98] disabled:opacity-60"
                  >
                    <Avatar className="h-full w-full rounded-xl">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} className="object-cover" /> : null}
                      <AvatarFallback className="rounded-xl bg-muted/80 text-muted-foreground">
                        <UserRound className="h-8 w-8 opacity-80" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                      {avatarBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => void onRemoveAvatar()}
                      disabled={avatarBusy}
                      className="text-xs font-bold text-destructive underline-offset-2 hover:underline disabled:opacity-60"
                    >
                      Rasmni olib tashlash
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <Label className="text-xs">Ism</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div>
                <Label className="text-xs">Login</Label>
                <Input
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  autoCapitalize="none"
                  disabled={isTelegram}
                />
                {isTelegram ? (
                  <p className="text-[11px] text-muted-foreground mt-1">Telegram orqali kirgan user — login o'zgartirilmaydi</p>
                ) : null}
              </div>

              <div>
                <Label className="text-xs">Rol</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleId)}
                  className="mt-1 h-12 w-full rounded-xl border border-input bg-card px-4 text-[1rem] font-semibold leading-snug text-foreground outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                >
                  <option value="staff">Administrator</option>
                  <option value="admin">Menedjer</option>
                </select>
              </div>

              {!isTelegram ? (
                <div>
                  <Label className="text-xs">Yangi parol (ixtiyoriy)</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Bo'sh qoldirsangiz o'zgarmaydi"
                  />
                  {passwordInvalid && (
                    <p className="text-[11px] text-destructive mt-1">Kamida 6 ta belgi</p>
                  )}
                </div>
              ) : null}

              <label className="flex items-center justify-between rounded-xl border border-input bg-card px-4 h-12 cursor-pointer">
                <span className="text-sm font-semibold">{active ? "Faol" : "Nofaol"}</span>
                <Switch checked={active} onCheckedChange={setActive} />
              </label>
            </div>

            <div className={bookingFormActionRow}>
              <button type="button" className={bookingFormBtnSecondary} onClick={onClose}>
                Bekor
              </button>
              <button
                type="button"
                className={bookingFormBtnPrimary}
                disabled={saveMut.isPending || passwordInvalid || !displayName.trim() || (!isTelegram && !login.trim())}
                onClick={() => saveMut.mutate()}
              >
                {saveMut.isPending ? "Saqlanmoqda…" : "Saqlash"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RolePicker({ value, onChange }: { value: RoleId; onChange: (v: RoleId) => void }) {
  const options: RoleId[] = ["staff", "admin"];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((r) => {
        const meta = ROLE_META[r];
        const Icon = meta.icon;
        const selected = value === r;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
              selected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold">{meta.label}</p>
            <p className="text-[10px] text-muted-foreground leading-snug">
              {r === "admin" ? "Tizim va xodimlarni boshqaradi" : "Mehmonlarni qabul qilish va joylashtirish"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

const StaffUsersPage = () => (
  <div className="px-4 pb-8 pt-4">
    <StaffUsersList />
  </div>
);

export default StaffUsersPage;
