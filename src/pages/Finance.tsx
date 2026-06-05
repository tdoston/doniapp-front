import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Wallet,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  Pencil,
} from "lucide-react";
import { fetchUsers, type AuthUserDto, type StaffUserDto } from "@/lib/api";
import {
  addPayment,
  deletePayment,
  formatSom,
  monthKey,
  monthLabelUz,
  PERIOD_LABEL,
  updatePayment,
  useManagerPayments,
  type ManagerPayment,
  type PaymentPeriod,
  type PaymentStatus,
} from "@/lib/financeStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ACCENT = "text-emerald-600";
const ACCENT_BG = "bg-emerald-600";
const ACCENT_SOFT = "bg-emerald-50";
const ACCENT_BORDER = "border-emerald-200";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> To'landi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
      <Clock className="h-3 w-3" /> Kutilmoqda
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "accent" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm",
        tone === "accent" && "bg-gradient-to-br from-emerald-500 to-emerald-600 border-transparent text-white shadow-emerald-500/25 shadow-lg",
        tone === "warn" && "bg-amber-50 border-amber-200",
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-[11px] font-bold uppercase tracking-wide", tone === "accent" ? "text-white/80" : "text-muted-foreground")}>
          {label}
        </p>
        <Icon className={cn("h-4 w-4", tone === "accent" ? "text-white/80" : tone === "warn" ? "text-amber-600" : "text-muted-foreground")} />
      </div>
      <p className={cn("mt-2 text-[1.35rem] font-black leading-tight tabular-nums", tone === "accent" ? "text-white" : "text-foreground")}>
        {value}
      </p>
      {sub ? <p className={cn("mt-0.5 text-[11px] font-medium", tone === "accent" ? "text-white/75" : "text-muted-foreground")}>{sub}</p> : null}
    </div>
  );
}

function MonthBars({ rows }: { rows: ManagerPayment[] }) {
  const buckets = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = format(d, "yyyy-MM");
      map.set(k, 0);
    }
    for (const r of rows) {
      if (r.status !== "paid") continue;
      const k = monthKey(r.date);
      if (map.has(k)) map.set(k, (map.get(k) || 0) + r.amount);
    }
    return Array.from(map.entries());
  }, [rows]);
  const max = Math.max(1, ...buckets.map(([, v]) => v));
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Oylik dinamika</p>
        <span className="text-[11px] font-semibold text-muted-foreground">Oxirgi 6 oy</span>
      </div>
      <div className="mt-4 flex items-end gap-2 h-28">
        {buckets.map(([k, v]) => {
          const h = Math.round((v / max) * 100);
          return (
            <div key={k} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex items-end">
                <div
                  className={cn("w-full rounded-t-lg transition-all", v > 0 ? "bg-emerald-500" : "bg-muted")}
                  style={{ height: `${Math.max(6, h)}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">{monthLabelUz(k).slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentRow({
  p,
  showManager,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  p: ManagerPayment;
  showManager: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {showManager ? (
          <Avatar className="h-11 w-11 rounded-xl">
            {p.managerAvatar ? <AvatarImage src={p.managerAvatar} alt={p.managerName} className="object-cover" /> : null}
            <AvatarFallback className="rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm">
              {initials(p.managerName) || "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {showManager ? (
                <p className="font-bold text-sm truncate">{p.managerName}</p>
              ) : (
                <p className="font-bold text-sm">{PERIOD_LABEL[p.period]}{p.customPeriod ? ` · ${p.customPeriod}` : ""}</p>
              )}
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {showManager ? `${PERIOD_LABEL[p.period]}${p.customPeriod ? ` · ${p.customPeriod}` : ""}` : ""}
                {showManager ? " · " : ""}
                {format(new Date(p.date), "dd.MM.yyyy")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[1rem] font-black tabular-nums text-emerald-700">{formatSom(p.amount)}</p>
              <div className="mt-1"><StatusBadge status={p.status} /></div>
            </div>
          </div>
          {p.note ? (
            <p className="mt-2 text-[12px] text-muted-foreground leading-snug line-clamp-2">{p.note}</p>
          ) : null}
          {(onEdit || onDelete || onToggleStatus) ? (
            <div className="mt-2.5 flex items-center gap-2">
              {onToggleStatus ? (
                <button
                  type="button"
                  onClick={onToggleStatus}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-background text-[11px] font-bold hover:bg-muted transition"
                >
                  {p.status === "paid" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {p.status === "paid" ? "Kutilmoqda" : "To'landi"}
                </button>
              ) : null}
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-background text-[11px] font-bold hover:bg-muted transition"
                >
                  <Pencil className="h-3 w-3" /> Tahrir
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-[11px] font-bold hover:bg-destructive/10 transition"
                >
                  <Trash2 className="h-3 w-3" /> O'chir
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type DialogInitial = Partial<ManagerPayment> & { id?: string };

function PaymentDialog({
  open,
  onOpenChange,
  managers,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  managers: StaffUserDto[];
  initial?: DialogInitial;
}) {
  const editing = Boolean(initial?.id);
  const [managerId, setManagerId] = useState<number>(initial?.managerId ?? managers[0]?.id ?? 0);
  const [amount, setAmount] = useState<string>(initial?.amount ? String(initial.amount) : "");
  const [period, setPeriod] = useState<PaymentPeriod>(initial?.period ?? "daily");
  const [customPeriod, setCustomPeriod] = useState<string>(initial?.customPeriod ?? "");
  const [date, setDate] = useState<string>(initial?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState<string>(initial?.note ?? "");
  const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? "paid");

  React.useEffect(() => {
    if (!open) return;
    setManagerId(initial?.managerId ?? managers[0]?.id ?? 0);
    setAmount(initial?.amount ? String(initial.amount) : "");
    setPeriod(initial?.period ?? "daily");
    setCustomPeriod(initial?.customPeriod ?? "");
    setDate(initial?.date ?? format(new Date(), "yyyy-MM-dd"));
    setNote(initial?.note ?? "");
    setStatus(initial?.status ?? "paid");
  }, [open, initial, managers]);

  const selected = managers.find((m) => m.id === managerId);
  const valid = managerId > 0 && Number(amount) > 0 && date;

  const submit = () => {
    if (!valid || !selected) return;
    const payload = {
      managerId,
      managerName: selected.display_name || selected.login,
      managerAvatar: selected.avatar_url,
      amount: Number(amount),
      period,
      customPeriod: period === "custom" ? customPeriod : undefined,
      note: note.trim() || undefined,
      date,
      status,
    };
    if (editing && initial?.id) {
      updatePayment(initial.id, payload);
    } else {
      addPayment(payload);
    }
    onOpenChange(false);
  };

  const PERIODS: PaymentPeriod[] = ["daily", "weekly", "3days", "4days", "custom"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "To'lovni tahrirlash" : "Yangi to'lov qo'shish"}</DialogTitle>
          <DialogDescription>Manager va davrni tanlang, summa va izoh kiriting.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold">Manager</Label>
            <div className="mt-1.5 grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
              {managers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3">Aktiv managerlar topilmadi.</p>
              ) : (
                managers.map((m) => {
                  const active = m.id === managerId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setManagerId(m.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all",
                        active ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30" : "border-border bg-background hover:bg-muted",
                      )}
                    >
                      <Avatar className="h-9 w-9 rounded-lg">
                        {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.display_name} className="object-cover" /> : null}
                        <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {initials(m.display_name || m.login)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{m.display_name || m.login}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">@{m.login}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Summa (so'm)</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-lg font-black"
            />
          </div>

          <div>
            <Label className="text-xs font-bold">To'lov turi</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "h-10 rounded-xl border text-[12px] font-bold transition",
                    period === p ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
            {period === "custom" ? (
              <Input
                value={customPeriod}
                onChange={(e) => setCustomPeriod(e.target.value)}
                placeholder="masalan: 10 kun"
                className="mt-2"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold">Sana</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-bold">Status</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("paid")}
                  className={cn(
                    "h-10 rounded-xl border text-[12px] font-bold transition",
                    status === "paid" ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  To'landi
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={cn(
                    "h-10 rounded-xl border text-[12px] font-bold transition",
                    status === "pending" ? "border-amber-500 bg-amber-500 text-white" : "border-border bg-background hover:bg-muted",
                  )}
                >
                  Kutilmoqda
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold">Izoh</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ixtiyoriy izoh…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-2xl border border-border bg-muted font-bold text-sm hover:bg-muted/80 transition"
            >
              Bekor
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!valid}
              className="h-12 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {editing ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuperadminExpenses() {
  const rows = useManagerPayments();
  const usersQ = useQuery({ queryKey: ["users"], queryFn: fetchUsers, staleTime: 60_000 });
  const managers = (usersQ.data?.users ?? []).filter((u) => u.active && (u.role === "admin" || u.role === "staff"));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManagerPayment | null>(null);

  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");

  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(monthKey(r.date)));
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (monthFilter !== "all" && monthKey(r.date) !== monthFilter) return false;
      if (managerFilter !== "all" && String(r.managerId) !== managerFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, monthFilter, managerFilter, statusFilter]);

  const totalAll = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const thisMonth = format(new Date(), "yyyy-MM");
  const totalMonth = rows.filter((r) => r.status === "paid" && monthKey(r.date) === thisMonth).reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Jami xarajat" value={formatSom(totalAll)} icon={Wallet} tone="accent" />
        <StatCard label="Shu oy" value={formatSom(totalMonth)} sub={monthLabelUz(thisMonth)} icon={TrendingUp} />
        <StatCard label="Kutilmoqda" value={formatSom(totalPending)} sub={`${pending.length} ta to'lov`} icon={Clock} tone="warn" />
        <StatCard label="Managerlar" value={String(managers.length)} sub="aktiv hodimlar" icon={CalendarIcon} />
      </div>

      <MonthBars rows={rows} />

      <button
        type="button"
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition"
      >
        <Plus className="h-5 w-5" /> Yangi to'lov qo'shish
      </button>

      {pending.length > 0 ? (
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-black text-amber-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Kutilayotgan to'lovlar
            </h2>
            <span className="text-[11px] font-bold text-amber-700">{pending.length}</span>
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <PaymentRow
                key={p.id}
                p={p}
                showManager
                onEdit={() => { setEditing(p); setDialogOpen(true); }}
                onDelete={() => { if (confirm("O'chirilsinmi?")) deletePayment(p.id); }}
                onToggleStatus={() => updatePayment(p.id, { status: "paid" })}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-black flex items-center gap-1.5">
            <Filter className="h-4 w-4" /> To'lovlar tarixi
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground">{filtered.length} ta</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-2.5 text-[12px] font-bold"
          >
            <option value="all">Barcha oylar</option>
            {monthsAvailable.map((m) => (
              <option key={m} value={m}>{monthLabelUz(m)}</option>
            ))}
          </select>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="h-10 rounded-xl border border-border bg-white px-2.5 text-[12px] font-bold"
          >
            <option value="all">Hamma manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name || m.login}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | PaymentStatus)}
            className="h-10 rounded-xl border border-border bg-white px-2.5 text-[12px] font-bold"
          >
            <option value="all">Barcha status</option>
            <option value="paid">To'landi</option>
            <option value="pending">Kutilmoqda</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white py-10 text-center">
            <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">Hozircha to'lovlar yo'q</p>
            <p className="text-[11px] text-muted-foreground mt-1">Yuqoridagi tugma orqali birinchi to'lovni qo'shing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <PaymentRow
                key={p.id}
                p={p}
                showManager
                onEdit={() => { setEditing(p); setDialogOpen(true); }}
                onDelete={() => { if (confirm("O'chirilsinmi?")) deletePayment(p.id); }}
                onToggleStatus={() => updatePayment(p.id, { status: p.status === "paid" ? "pending" : "paid" })}
              />
            ))}
          </div>
        )}
      </section>

      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} managers={managers} initial={editing ?? undefined} />
    </div>
  );
}

function ManagerEarnings({ me }: { me: AuthUserDto }) {
  const allRows = useManagerPayments();
  const rows = useMemo(() => allRows.filter((r) => r.managerId === me.id), [allRows, me.id]);

  const [monthFilter, setMonthFilter] = useState<string>("all");

  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(monthKey(r.date)));
    return Array.from(set).sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => monthFilter === "all" || monthKey(r.date) === monthFilter);
  }, [rows, monthFilter]);

  const totalAll = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const thisMonth = format(new Date(), "yyyy-MM");
  const totalMonth = rows.filter((r) => r.status === "paid" && monthKey(r.date) === thisMonth).reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);
  const last = rows.find((r) => r.status === "paid");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Umumiy daromad" value={formatSom(totalAll)} icon={Wallet} tone="accent" />
        <StatCard label="Shu oy" value={formatSom(totalMonth)} sub={monthLabelUz(thisMonth)} icon={TrendingUp} />
        <StatCard
          label="Oxirgi to'lov"
          value={last ? formatSom(last.amount) : "—"}
          sub={last ? format(new Date(last.date), "dd.MM.yyyy") : "yo'q"}
          icon={CalendarIcon}
        />
        <StatCard label="Kutilmoqda" value={formatSom(totalPending)} sub={`${pending.length} ta`} icon={Clock} tone="warn" />
      </div>

      <MonthBars rows={rows} />

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-black flex items-center gap-1.5">
            <Filter className="h-4 w-4" /> To'lovlar tarixi
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground">{filtered.length} ta</span>
        </div>
        <div className="mb-3">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-[13px] font-bold"
          >
            <option value="all">Barcha oylar</option>
            {monthsAvailable.map((m) => (
              <option key={m} value={m}>{monthLabelUz(m)}</option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white py-10 text-center">
            <Wallet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">Hozircha to'lovlar yo'q</p>
            <p className="text-[11px] text-muted-foreground mt-1">Superadmin to'lov qo'shganida shu yerda ko'rinadi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <PaymentRow key={p.id} p={p} showManager={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type FinancePageProps = { me: AuthUserDto };

const FinancePage = ({ me }: FinancePageProps) => {
  const navigate = useNavigate();
  const isSuper = me.role === "super_admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-lg px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl border border-border bg-white flex items-center justify-center hover:bg-muted transition"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.05rem] font-black tracking-tight leading-tight">
              {isSuper ? "Xarajatlarim" : "Daromadlarim"}
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground">
              {isSuper ? "Managerlarga to'lovlar boshqaruvi" : "Sizning to'lovlaringiz tarixi"}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-5 pb-16">
        {isSuper ? <SuperadminExpenses /> : <ManagerEarnings me={me} />}
      </main>
    </div>
  );
};

export default FinancePage;
