/** Prod backend (doniapp-back). Buildda `VITE_API_BASE` berilsa u ustun. */
export const PROD_API_BASE = "https://doniapp-back-production.up.railway.app/api";

export function resolveApiBase(): string {
  const base = (import.meta.env.VITE_API_BASE ?? "").trim().replace(/\/$/, "");
  const originUrl = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  const reactOrigin = (import.meta.env.REACT_APP_API_URL ?? "").trim().replace(/\/$/, "");

  if (base) {
    if (base.startsWith("http://") || base.startsWith("https://")) {
      try {
        const u = new URL(base);
        if (!u.pathname || u.pathname === "/") return `${base}/api`;
      } catch {
        /* use raw */
      }
    }
    return base;
  }
  if (originUrl) return `${originUrl}/api`;
  if (reactOrigin) return `${reactOrigin}/api`;

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h.includes("doniapp-front") || (h.endsWith(".up.railway.app") && !h.includes("doniapp-back"))) {
      return PROD_API_BASE;
    }
  }
  return "/api";
}
