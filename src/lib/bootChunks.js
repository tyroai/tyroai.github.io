import { bootHint } from "./bootHint"

/**
 * Girişten sonraki uygulama ve giriş ekranı AYRI parçalar: oturumsuz ziyaretçi uygulamayı
 * (kabuk, sayfalar, widget'lar) indirmez, oturumu olan da giriş ekranını. Tek tanım burada —
 * `AuthGate`in `lazy()`si ve açılıştaki erken ısıtma aynı `import()`u paylaşır.
 */
export const loadApp = () => import("@/App.jsx")
export const loadLogin = () =>
  import("@/features/auth/LoginPage").then((m) => ({ default: m.LoginPage }))

/** Açılışta tahmin edilen parçayı hemen istemeye başlar (MSAL açılırken paralel iner). */
export function warmBootChunk({ signedIn = false } = {}) {
  const hint = signedIn ? "app" : bootHint()
  // Hata yutulur: parça gerçekten gerekince `lazy()` yeniden dener ve sınırı yakalar.
  if (hint === "app") loadApp().catch(() => {})
  else if (hint === "login") loadLogin().catch(() => {})
}
