import { lazy, Suspense, useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"
import { InteractionStatus } from "@azure/msal-browser"
import { isMsalConfigured, MOCK_LOGGED_IN_KEY } from "@/lib/msal"
import { readDevAuthBypass } from "@/lib/devAuth"
import { useLocale } from "@/hooks/useLocale"
import { loadApp, loadLogin } from "@/lib/bootChunks"
import { ABOUT_PATH, isPublicPage, publicPagePath } from "@/lib/publicPages"
import { Toaster } from "@/components/ui/sonner"
import { UpdatePrompt } from "@/components/common/UpdatePrompt"

// Kapı küçük kalır: giriş ekranı ve girişten sonraki uygulama ayrı parçalar (lib/bootChunks).
const App = lazy(loadApp)
const LoginPage = lazy(loadLogin)
// Tanıtım sayfaları TEMBEL: girişten açılır, yalnız açana iner.
const AboutPage = lazy(() =>
  import("@/features/about/AboutPage").then((m) => ({ default: m.AboutPage })),
)
const TeamPage = lazy(() =>
  import("@/features/team/TeamPage").then((m) => ({ default: m.TeamPage })),
)

// MOCK_LOGGED_IN_KEY: yalnız MSAL yapılandırılmamışken (VITE_MSAL_CLIENT_ID yok) kullanılan
// sekme bayrağı — giriş her tarayıcı oturumunda yeniden istenir.
function readMockLoggedIn() {
  if (typeof window === "undefined") return false
  return window.sessionStorage.getItem(MOCK_LOGGED_IN_KEY) === "1"
}

// Anasayfa açılıyorsa hava şimdiden: sıcaklık sayfanın en büyük içeriği (LCP), konum ve tahmin
// girişe bağlı değil — App ve sayfa parçalarının inmesini beklemesin (`useWeather` › prefetchWeather).
function WarmHome() {
  const { locale } = useLocale()
  useEffect(() => {
    let alive = true
    import("@/hooks/useWeather").then((m) => alive && m.prefetchWeather(locale)).catch(() => {})
    return () => {
      alive = false
    }
  }, [locale])
  return null
}

// Yönlendirici adresleri büyük/küçük harf duyarsız eşler: "/MySpace" de Anasayfa.
const isHome = (path) => /^(\/myspace)?$/i.test(path.replace(/\/+$/, ""))

function GateContent() {
  const location = useLocation()
  const { instance, inProgress } = useMsal()
  const isMsalAuthenticated = useIsAuthenticated()
  const devAuthBypass = readDevAuthBypass()

  // MSAL açılırken ya da redirect dönüşünü işlerken kapı kararı verilmez: hesap olayı
  // handleRedirectPromise'tan sonra bir tık geç yayılabilir. Dev kestirmesi beklemez.
  const msalSettling = isMsalConfigured && !devAuthBypass && inProgress !== InteractionStatus.None
  // Kanca tepkisellik için, getActiveAccount() redirect sonrası ilk çizim için (kanca bir tık geç).
  const isAuthenticated =
    devAuthBypass ||
    (isMsalConfigured ? isMsalAuthenticated || !!instance.getActiveAccount() : readMockLoggedIn())

  if (location.pathname === "/login") {
    // Girişli biri /login'e düşerse (taze Entra dönüşü) giriş ekranı atlanır.
    if (isAuthenticated) return <Navigate to="/myspace" replace />
    return <LoginPage />
  }
  // Tanıtım sayfaları kabuksuz ve oturumsuz.
  if (isPublicPage(location.pathname)) {
    return publicPagePath(location.pathname) === ABOUT_PATH ? <AboutPage /> : <TeamPage />
  }
  if (msalSettling) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // App kendi Suspense sınırında: inerken WarmHome'u bekletmez (aynı sınırda hava App'i beklerdi).
  return (
    <>
      {isHome(location.pathname) && <WarmHome />}
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </>
  )
}

/**
 * Kimlik kapısı: oturumsuz yol (giriş, tanıtım sayfaları) uygulamanın kodunu indirmeden
 * çizilir. Bildirim yığını ve "Yeni sürüm hazır" kartı (servis çalışanını kaydeden yer)
 * her dalda TEK örnek: girişten uygulamaya geçişte yeniden mount olmaz.
 */
export function AuthGate() {
  return (
    <>
      <Suspense fallback={null}>
        <GateContent />
      </Suspense>
      <Toaster richColors position="bottom-right" />
      <UpdatePrompt />
    </>
  )
}
