/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // NEXT_PUBLIC_* is injected by Vercel / deployment platforms. Vite does
  // not expose non-VITE_ prefixed vars via import.meta.env, so we read it
  // explicitly in services/api-client.ts and declare it here for typing.
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
