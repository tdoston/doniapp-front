/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API yo'li: devda `/api` (Vite proksi), prod yoki previewda masalan `https://api.host.com/api` */
  readonly VITE_API_BASE?: string;
  /** Vite dev: `/api` -> Django (runserver) */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
