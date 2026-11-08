// ⚠️ DOSYANIN İLK SATIRI, ve ESM importlarından ÖNCE yazılmış olması
// yetmiyor — importlar hoist ediliyor, yani bu satıra gelinmesi "bütün
// bağımlılıklar indi ve çalıştı" demek. Açılış bekçisinin (index.html)
// beklediği işaret tam olarak bu: giriş modülü GERÇEKTEN koştu mu.
window.__TYRO_BOOT__ = 1

import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { MsalProvider } from "@azure/msal-react"
import "@fontsource/kanit/700.css"
import "./index.css"
// generative-loaders ships its own stylesheet; the package renders nothing
// without it. After index.css so our tokens win any collision.
import "generative-loaders/styles.css"
import { AuthGate } from "./AuthGate.jsx"
import { warmBootChunk } from "@/lib/bootChunks"
import { bootHint } from "@/lib/bootHint"
import { readDevAuthBypass } from "@/lib/devAuth"
import { msalInstance, ensureMsalInitialized, isMsalConfigured, loginRequest } from "@/lib/msal"
import { shouldAttemptSilentSso, attemptSilentSso, isExpectedSilentError } from "@/lib/silentSso"
import { isSessionAlive, clearLocalSession } from "@/lib/sessionExpiry"
import { onNotificationAction } from "@/lib/notify/browserNotify"
import { requestOpenChat } from "@/lib/chatBus"
import { startRestMode } from "@/lib/restMode"
import { applyCacheMigration } from "@/lib/cacheMigration"
import { isMsalOwnedWindow, runMsalRedirectBridge } from "@/lib/msalRedirectBridge"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { LocaleProvider } from "@/providers/LocaleProvider"
import { PaletteProvider } from "@/providers/PaletteProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { chosenLocale, loadDictionary } from "@/lib/i18nDictionaries"
// Kurulum isteği açılışta bir kez gelir: erken yakalansın (menü sonra açılsa da).
import "@/lib/pwaInstall"

// DEV: `?data=worst` en kötü veri anahtarı (src/dev/worstCase); üretimde ölü kod, pakete girmez.
const DevDataToggle = import.meta.env.DEV ? lazy(() => import("@/dev/worstCase/DataToggle")) : null

// BASE_URL is "/" everywhere now that the SPA is served from the custom
// domain tyroai.github.io root (bound in the repo's Pages settings).
// Kept as-is via env in case base ever changes again.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

// MSAL'ın KENDİ açtığı pencerede (gizli yenileme iframe'i ya da popup)
// uygulama AÇILMAZ: o pencerenin tek işi cevabı açan pencereye ulaştırmak ve
// kapanmaktır. Gerekçe, ölçümler ve "neden yalnız `window.opener` yetmez"
// `src/lib/msalRedirectBridge.js`te yazılı.
//
// ⚠️ Burada `handleRedirectPromise()` ÇAĞRILMAZ. Depo `localStorage`
// kullanıyor, yani "devam eden etkileşim" kaydı açan pencereyle PAYLAŞILIR:
// popup'ta çağrılan bir `handleRedirectPromise`, açan pencerenin beklediği
// cevabı tüketip istek önbelleğini sıfırlıyordu.
if (isMsalOwnedWindow()) {
  void runMsalRedirectBridge()
} else {
  // BEFORE React reads localStorage: one-time cleanup of agent logos the old
  // Copilot `bot` table fetch left in the config cache. See the module — the
  // fetch is gone, but its output would otherwise keep rendering from cache.
  applyCacheMigration()

  // Answer-notification buttons. A service-worker notification has no default
  // click behaviour: notify-sw.js focuses this tab and posts the chosen action
  // here, and this turns it into the same in-app "open the chat" signal the
  // toast uses. Registered at boot, outside React, so it works whatever screen
  // happens to be mounted when the click arrives.
  onNotificationAction((action) => requestOpenChat({ focusComposer: action === "reply" }))

  // Pencere odakta değilken ya da bir dakika dokunulmayınca süs animasyonları durur.
  startRestMode()

  // bfcache: sessiz SSO turunu başlatan belge HİÇ çizilmedi (#root boş) ama
  // oturum geçmişinde duruyor. Geri düğmesi onu olduğu gibi geri
  // yükleyebilir — modül betikleri bfcache dönüşünde YENİDEN ÇALIŞMAZ — ve
  // ekranda kalıcı bir beyaz sayfa kalır. Yeniden yüklüyoruz; sekme başına
  // tek deneme işareti (sessionStorage) bu yenilemenin turu tekrar
  // tetiklemesini imkânsız kılıyor.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && !document.getElementById("root")?.hasChildNodes()) {
      window.location.reload()
    }
  })

  // İlk ekranın dilinin sözlüğü MSAL açılışıyla paralel iner; çizim onu bekler (Türkçe yanıp
  // sönmesin). Seçim yoksa giriş ve tanıtım sayfaları İngilizce (`defaultLocaleFor`): oturumsuz
  // açılışta (tahmin: giriş) İngilizce önceden iner. İnemezse Türkçe çizilir, sağlayıcı yeniden dener.
  const dictionaryReady = loadDictionary(
    chosenLocale() ?? (bootHint() === "app" ? "tr" : "en"),
  ).catch(() => null)
  // Tahmin edilen parça (uygulama ya da giriş) MSAL açılışıyla paralel inmeye başlar;
  // derlemede index.html'deki satır içi ipucu bunu HTML okunurken zaten başlatmış olur.
  warmBootChunk({ signedIn: readDevAuthBypass() })
  const start = () => dictionaryReady.then(renderApp)

  let rendered = false
  function renderApp() {
    if (rendered) return // bir throw'dan sonra ikinci kez createRoot olmasın
    rendered = true
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        {/* Son savunma: sağlayıcılar dahil her şey; panel router ve dil olmadan da çizilir. */}
        <ErrorBoundary scope="app">
          <BrowserRouter basename={basename}>
            <MsalProvider instance={msalInstance}>
              <ThemeProvider>
                <PaletteProvider>
                  <LocaleProvider>
                    <TooltipProvider delayDuration={150}>
                      <AuthGate />
                      {DevDataToggle && (
                        <Suspense fallback={null}>
                          <DevDataToggle />
                        </Suspense>
                      )}
                    </TooltipProvider>
                  </LocaleProvider>
                </PaletteProvider>
              </ThemeProvider>
            </MsalProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>,
    )
    // Açılış bekçisinin sayaçlarını durdur (bkz. index.html): buraya
    // gelindiyse React kök ağacı gerçekten monte edildi.
    window.__tyroBootOk?.()
  }

  // Yeni bir hesap redirect'ten AZ ÖNCE geldiyse aşağıdaki oturum yoklaması
  // atlanır: o belirteç saniyelik ve yoklamak yalnız bir ağ turu maliyeti.
  let justRedirected = false

  // `Promise.resolve().then(...)`: `ensureMsalInitialized` SENKRON fırlatırsa
  // (config regresyonu) çıplak çağrı zinciri atlar ve `renderApp` hiç
  // çalışmadan beyaz sayfa kalırdı; böyle sarınca aşağıdaki catch yakalıyor.
  Promise.resolve()
    .then(() => ensureMsalInitialized())
    .then(() => msalInstance.handleRedirectPromise())
    .then((result) => {
      if (result?.account) {
        justRedirected = true
        msalInstance.setActiveAccount(result.account)
        // Redirect URI is root; route the freshly-authed user straight to
        // the home page (/myspace, Anasayfa) so the auth gate doesn't flash
        // /login while React's useIsAuthenticated catches up after the
        // redirect callback.
        window.history.replaceState(null, "", import.meta.env.BASE_URL + "myspace")
      }
      // Hesap belli oldu: uygulama parçası oturum yoklamasıyla paralel insin (ipucu ıskaladıysa).
      if (msalInstance.getAllAccounts().length > 0) warmBootChunk({ signedIn: true })
      return null
    })
    .catch((err) => {
      // Başarısız bir sessiz SSO denemesinin NORMAL dönüş yolu burasıdır
      // (login_required ve akrabaları) — sessizce loglanır ve giriş ekranına
      // düşülür. Geri kalanı (kullanıcı Entra isteminden geri çıktı →
      // access_denied, config hatası) uyarıyı hak ediyor. Her hâlükârda hata
      // AŞAĞIYA taşınır: zaten hata dönmüş bir açılışın üstüne sessiz deneme
      // zincirlenmemeli.
      const log = isExpectedSilentError(err) ? "info" : "warn"
      console[log]("[MSAL] redirect returned an error:", err?.errorCode || err?.message || err)
      // Her zaman doğru bir değer: falsy bir reddin (bir yerde throw
      // undefined) de denemeyi bloklaması gerekiyor.
      return err || new Error("redirect failed with no error object")
    })
    .then(async (redirectError) => {
      // MSAL önbelleğinde HESAP durması, çalışan bir OTURUM demek değil.
      // Yenileme belirteci ölmüş olabilir (süre, iptal, parola değişimi) ve
      // uygulama yine "giriş yapılmış" gibi açılıp parça parça çöker:
      // sohbet mesaj gönderemez, Copilot Studio ortada bir popup açar,
      // katalog okunamaz. Kimse bunu "belirtecim öldü" diye okumuyor.
      //
      // Soru bir kez, BURADA, React mount edilmeden önce sorulur. Belirteç
      // ölmüşse yerel oturum düşürülür — ve bir sonraki satırın doğru şeyi
      // yapmasını sağlayan tam olarak budur: ortada hesap kalmayınca sessiz
      // SSO kararı "zaten girişli, atla"dan "prompt=none dene"ye döner.
      // Entra oturumu çoğu zaman bizim belirtecimizden uzun yaşadığı için
      // kullanıcı hiçbir şey yazmadan dashboard'una geri düşer; düşmezse
      // yarı bozuk bir uygulama yerine dürüst bir giriş ekranı görür.
      //
      // ⚠️ SÜRE SINIRI BURADA, fonksiyonun içinde DEĞİL: bu soru ilk boyamayı
      // bekletiyor ve `acquireTokenSilent` bir ağ turu — takılmış bir ağda
      // cevap hiç gelmeyebilir ve kullanıcı süresiz beyaz ekranda kalır.
      // 1,5 sn fazlasıyla cömert (tipik tur 250-800 ms) ve süre dolarsa cevap
      // "yaşıyor" olur: şüphede kalınca yaşıyor demek, yanlış "öldü" kararıyla
      // birini işinin ortasında dışarı atmaktan iyidir.
      const sessionAlive =
        isMsalConfigured && !justRedirected
          ? await Promise.race([
              isSessionAlive(msalInstance),
              new Promise((resolve) => setTimeout(() => resolve(true), 1500)),
            ])
          : true
      if (!sessionAlive) {
        await clearLocalSession(msalInstance)
      }
      // Sessiz SSO (prompt=none, tam sayfa redirect — neden `ssoSilent`
      // değil ve hangi korumalar var: src/lib/silentSso.js). Karar React
      // mount edilmeden ÖNCE veriliyor: deneme yapılırsa sayfa hiç çizmeden
      // gidiyor, yani giriş ekranı bir kare bile görünmüyor.
      if (isMsalConfigured && shouldAttemptSilentSso({ msalInstance, redirectError })) {
        const navigating = await attemptSilentSso(msalInstance, loginRequest)
        if (navigating) return
      }
      start()
    })
    // Son çare: yukarıda ne fırlarsa fırlasın kullanıcı beyaz sayfa değil
    // uygulamayı görsün (eski `.finally(render)` garantisinin yerine).
    .catch((err) => {
      console.warn("[boot] unexpected failure:", err?.message || err)
      start()
    })
}
