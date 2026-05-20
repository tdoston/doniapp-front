import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Rooms from "./pages/Rooms.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import {
  authTelegram,
  authTelegramLogin,
  authPasswordLogin,
  clearAuthToken,
  fetchMe,
  getAuthToken,
  setAuthToken,
  type AuthUserDto,
  type TelegramLoginPayload,
} from "./lib/api";
import { getTelegramInitData, isTelegramWebApp } from "./lib/telegramWebApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const AppRoutes = ({
  me,
  onLogout,
  onMeUpdate,
}: {
  me: AuthUserDto;
  onLogout: () => void;
  onMeUpdate: (next: AuthUserDto) => void;
}) => (
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={<Rooms currentUser={me} currentUserRole={me.role} onLogout={onLogout} onMeUpdate={onMeUpdate} />}
      />
      <Route path="/booking" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const TELEGRAM_LOGIN_BOT = String(import.meta.env.VITE_TELEGRAM_LOGIN_BOT || "").trim();
const AUTH_REQUEST_TIMEOUT_MS = 12_000;

async function withTimeout<T>(p: Promise<T>, ms = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Authorization timeout")), ms);
  });
  try {
    return await Promise.race([p, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const TelegramLoginWidget = ({
  onAuth,
  onError,
}: {
  onAuth: (payload: TelegramLoginPayload) => Promise<void>;
  onError: (message: string) => void;
}) => {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const node = holderRef.current;
    if (!node) return;
    if (!TELEGRAM_LOGIN_BOT) return;
    const cbName = "__swiftBookingsTelegramAuth";
    (window as Window & { [k: string]: unknown })[cbName] = async (user: unknown) => {
      if (!user || typeof user !== "object") {
        onError("Telegram login javobi noto'g'ri.");
        return;
      }
      setBusy(true);
      try {
        await onAuth(user as TelegramLoginPayload);
      } catch (e) {
        onError(e instanceof Error ? e.message : "Telegram login xatosi");
      } finally {
        setBusy(false);
      }
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.setAttribute("data-telegram-login", TELEGRAM_LOGIN_BOT);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-userpic", "false");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-onauth", `${cbName}(user)`);
    node.innerHTML = "";
    node.appendChild(s);
    return () => {
      delete (window as Window & { [k: string]: unknown })[cbName];
      if (node) node.innerHTML = "";
    };
  }, [onAuth, onError]);

  if (!TELEGRAM_LOGIN_BOT) {
    return <p className="text-sm text-destructive">`VITE_TELEGRAM_LOGIN_BOT` sozlanmagan.</p>;
  }
  return (
    <div className="space-y-3 text-center">
      <div ref={holderRef} className="flex justify-center" />
      {busy ? <p className="text-xs text-muted-foreground">Tekshirilmoqda...</p> : null}
    </div>
  );
};

const LoginPasswordForm = ({
  onLogin,
  busy,
}: {
  onLogin: (login: string, password: string) => Promise<void>;
  busy: boolean;
}) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await onLogin(login.trim(), password);
      }}
    >
      <input
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="Login"
        autoComplete="username"
        className="h-12 w-full rounded-xl border border-input bg-card px-4 text-[1rem] font-semibold leading-snug text-foreground outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Parol"
        autoComplete="current-password"
        className="h-12 w-full rounded-xl border border-input bg-card px-4 text-[1rem] font-semibold leading-snug text-foreground outline-none transition-all placeholder:font-normal placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
      />
      <button
        type="submit"
        disabled={busy || !login.trim() || !password}
        className="h-11 w-full rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
      >
        {busy ? "Kirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [me, setMe] = useState<AuthUserDto | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"telegram" | "password">("telegram");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const logout = () => {
    clearAuthToken();
    try {
      sessionStorage.clear();
    } catch {
      void 0;
    }
    setMe(null);
    setError("");
    setNeedsLogin(true);
    setAuthMode("telegram");
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = getAuthToken();
        if (token) {
          const meRes = await withTimeout(fetchMe());
          if (!cancelled) {
            setMe(meRes.user);
            setLoading(false);
          }
          return;
        }
        if (!isTelegramWebApp()) {
          if (!cancelled) {
            setNeedsLogin(true);
            setLoading(false);
          }
          return;
        }
        const initData = getTelegramInitData();
        if (!initData) {
          if (!cancelled) {
            setNeedsLogin(true);
            setLoading(false);
          }
          return;
        }
        const loginRes = await withTimeout(authTelegram(initData));
        setAuthToken(loginRes.token);
        const meRes = await withTimeout(fetchMe());
        if (!cancelled) {
          setMe(meRes.user);
          setLoading(false);
        }
      } catch (e) {
        clearAuthToken();
        if (!cancelled) {
          setNeedsLogin(true);
          setError(e instanceof Error ? e.message : "Authorization xatosi");
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {loading ? (
        <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Yuklanmoqda...</div>
      ) : me ? (
        <AppRoutes me={me} onLogout={logout} onMeUpdate={setMe} />
      ) : needsLogin ? (
        <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-indigo-500/5 via-background to-violet-500/5">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl p-5 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-black tracking-tight">DoniHostel</h1>
              <p className="text-xs text-muted-foreground">Kirish usulini tanlang</p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => setAuthMode("telegram")}
                className={`h-10 rounded-xl text-sm font-bold transition ${
                  authMode === "telegram" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("password")}
                className={`h-10 rounded-xl text-sm font-bold transition ${
                  authMode === "password" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                Login / Parol
              </button>
            </div>

            {authMode === "telegram" ? (
              <TelegramLoginWidget
                onError={(msg) => setError(msg)}
                onAuth={async (payload) => {
                  const loginRes = await authTelegramLogin(payload);
                  setAuthToken(loginRes.token);
                  const meRes = await fetchMe();
                  setMe(meRes.user);
                  setError("");
                }}
              />
            ) : (
              <LoginPasswordForm
                busy={passwordBusy}
                onLogin={async (login, password) => {
                  setPasswordBusy(true);
                  try {
                    const loginRes = await withTimeout(authPasswordLogin({ login, password }));
                    setAuthToken(loginRes.token);
                    const meRes = await withTimeout(fetchMe());
                    setMe(meRes.user);
                    setError("");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Kirishda xato");
                  } finally {
                    setPasswordBusy(false);
                  }
                }}
              />
            )}

            {error ? <p className="text-xs text-center text-destructive">{error}</p> : null}
          </div>
        </div>
      ) : (
        <div className="min-h-screen grid place-items-center px-4 text-center text-sm text-destructive">
          {error || "Authorization xatosi"}
        </div>
      )}
    </QueryClientProvider>
  );
};

export default App;
