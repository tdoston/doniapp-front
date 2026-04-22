import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { createUser, deactivateUser, fetchUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StaffUsersPage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 20_000,
  });

  const [login, setLogin] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");

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
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const users = data?.users ?? [];

  return (
    <div className="px-4 pb-6 space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-extrabold flex items-center gap-2">
          <UserCog className="w-4 h-4 text-primary" />
          Yangi foydalanuvchi
        </h2>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Login</Label>
            <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="masalan: ali" className="h-10" />
          </div>
          <div>
            <Label className="text-xs">Ism</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ko'rinadigan ism"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs">Parol (min 6)</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs">Rol</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "staff")}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="staff">Xodim</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button
            type="button"
            className="w-full"
            disabled={createMut.isPending || !login.trim() || !displayName.trim() || password.length < 6}
            onClick={() => createMut.mutate()}
          >
            {createMut.isPending ? "Saqlanmoqda…" : "Qo'shish"}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-center text-sm text-muted-foreground py-6">Yuklanmoqda…</p>}
      {isError && (
        <div className="text-center py-6">
          <p className="text-sm text-destructive mb-2">Ma&apos;lumot olinmadi</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Qayta
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                u.active ? "border-border bg-card" : "border-muted opacity-60"
              }`}
            >
              <div>
                <p className="text-sm font-bold">{u.display_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  @{u.login} · {u.role === "admin" ? "Admin" : "Xodim"}
                  {!u.active && " · nofaol"}
                </p>
              </div>
              {u.active && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive text-xs font-bold"
                  disabled={deactivateMut.isPending}
                  onClick={() => {
                    if (window.confirm(`${u.display_name} ni nofaol qilasizmi?`)) {
                      deactivateMut.mutate(u.id);
                    }
                  }}
                >
                  O'chirish
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StaffUsersPage;
