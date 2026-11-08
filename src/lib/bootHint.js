/**
 * Açılışta hangi büyük parçanın gerekeceğinin TAHMİNİ: "app" (oturum var ya da Entra'dan
 * dönülüyor), "public" (Hakkımızda · Ekibimiz) ya da "login".
 *
 * ⚠️ İÇE AKTARMA YOK, dışarıdan değişken yok: derlemede bu fonksiyonun METNİ index.html'e
 * satır içi gömülür (`scripts/vite/bootPreload.mjs`) — tarayıcı parçayı HTML okunurken
 * indirmeye başlasın diye. Yanlış tahmin yalnız boşa bir indirme demek, karar değil:
 * kapıyı yine MSAL verir (`AuthGate`).
 */
export function bootHint() {
  try {
    var path = window.location.pathname.replace(/\/+$/, "")
    if (path === "/about" || path === "/team") return "public"
    // Entra dönüşü: hesap henüz önbellekte olmayabilir ama gidilecek yer uygulama.
    if (/[?#&]code=/.test(window.location.href)) return "app"
    for (var i = 0; i < window.localStorage.length; i++) {
      var key = window.localStorage.key(i)
      if (key && /^msal\.(\d+\.)?account\.keys$/.test(key)) {
        var value = window.localStorage.getItem(key)
        if (value && value !== "[]") return "app"
      }
    }
  } catch {
    // Depo kapalıysa tahmin yok: giriş en olası ekran.
  }
  return "login"
}
