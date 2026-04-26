/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** API yo'li: devda `/api` (Vite proksi), prod yoki previewda masalan `https://api.host.com/api` */
  readonly VITE_API_BASE?: string;
  /** API origin (oxirida slash yo'q); `VITE_API_BASE` bo'lmasa shunga `/api` qo'shiladi */
  readonly VITE_API_URL?: string;
  /** CRA uslubi; `VITE_API_BASE`/`VITE_API_URL` bo'lmasa ishlatiladi */
  readonly REACT_APP_API_URL?: string;
  /** Vite dev: `/api` -> Django (runserver) */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
