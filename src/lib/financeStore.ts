import { useEffect, useState } from "react";

export type PaymentPeriod = "daily" | "weekly" | "3days" | "4days" | "custom";
export type PaymentStatus = "paid" | "pending";

export const PERIOD_LABEL: Record<PaymentPeriod, string> = {
  daily: "Kunlik",
  weekly: "Haftalik",
  "3days": "3 kunlik",
  "4days": "4 kunlik",
  custom: "Maxsus davr",
};

export type ManagerPayment = {
  id: string;
  managerId: number;
  managerName: string;
  managerAvatar?: string;
  amount: number;
  period: PaymentPeriod;
  customPeriod?: string;
  note?: string;
  date: string; // yyyy-MM-dd
  status: PaymentStatus;
  createdAt: string;
};

const KEY = "finance:managerPayments:v1";
const EVT = "finance:changed";

function read(): ManagerPayment[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ManagerPayment[]) : [];
  } catch {
    return [];
  }
}

function write(rows: ManagerPayment[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event(EVT));
  } catch {
    void 0;
  }
}

export function listPayments(): ManagerPayment[] {
  return read().sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function addPayment(p: Omit<ManagerPayment, "id" | "createdAt">): ManagerPayment {
  const item: ManagerPayment = {
    ...p,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  write([item, ...read()]);
  return item;
}

export function updatePayment(id: string, patch: Partial<ManagerPayment>) {
  write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function deletePayment(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function useManagerPayments(): ManagerPayment[] {
  const [rows, setRows] = useState<ManagerPayment[]>(() => listPayments());
  useEffect(() => {
    const refresh = () => setRows(listPayments());
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return rows;
}

export function formatSom(n: number): string {
  return `${Math.round(n).toLocaleString("uz-UZ")} so'm`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-MM
}

export function monthLabelUz(yyyymm: string): string {
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
  const [y, m] = yyyymm.split("-");
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${months[idx]} ${y}`;
}
