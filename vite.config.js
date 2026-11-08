import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { buildInfo } from "./scripts/vite/buildInfo.mjs"
import { iconShards } from "./scripts/vite/iconShards.mjs"

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// Demo yapılandırması. Kaynak uygulamanın PWA, ön yükleme ve parça gruplama eklentileri yok:
// servis çalışanı Pages'te bayat sürüm riski taşır, ötekiler yalnız başarım eniyilemesi.
export default defineConfig({
  // tyroai.github.io kök adreste yayınlanır (kuruluş sitesi).
  base: "/",
  plugins: [react(), tailwindcss(), buildInfo(), iconShards()],
  resolve: {
    alias: [
      // Giriş ve Graph/Dataverse katmanının sahte karşılıkları (demo/shims). Tam eşleşme: alt yollar
      // (`/redirect-bridge`) ayrı eşlenir.
      {
        find: /^@azure\/msal-browser\/redirect-bridge$/,
        replacement: r("./demo/shims/msal-redirect-bridge.js"),
      },
      { find: /^@azure\/msal-browser$/, replacement: r("./demo/shims/msal-browser.js") },
      { find: /^@azure\/msal-react$/, replacement: r("./demo/shims/msal-react.jsx") },
      {
        find: /^@microsoft\/agents-copilotstudio-client$/,
        replacement: r("./demo/shims/copilot-client.js"),
      },
      { find: /^virtual:pwa-register\/react$/, replacement: r("./demo/shims/pwa-register-react.js") },
      { find: "@demo", replacement: r("./demo") },
      { find: "@", replacement: r("./src") },
    ],
  },
  build: {
    chunkSizeWarningLimit: 6000,
  },
  server: { port: 5173, strictPort: false },
})
