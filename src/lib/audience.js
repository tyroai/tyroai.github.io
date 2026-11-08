/**
 * ═══════════════════════════════════════════════════════════════════════
 *  KİTLE — bir özelliği KİM görsün (tek eşleştirici + önizleme listesi)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Deponun politikaları aynı sözlüğü konuşuyor (`WARM_START`,
 * `DAILY_BRIEF`, `FEED`, `MYSPACE`):
 *
 *   "*"          → herkes
 *   "admins"     → yalnız yönetici grubu (`ADMIN_GROUP_ID`), KATI `=== true`
 *   [ "upn", … ] → yalnız bu kullanıcılar
 *
 * ⚠️ **LİSTE UPN İLE EŞLEŞİR, POSTA ADRESİYLE DEĞİL.** MSAL `username`i
 * UPN'dir; TYRO'de ikisi aynı şey değil (801 aktif kullanıcının 237'sinde
 * farklı — `lib/authorizations.js`). Posta adresiyle yazılmış bir liste
 * yabancı iştirakleri sessizce kapıda bırakırdı. Karşılaştırma büyük/küçük
 * harf duyarsız, boşluklar kırpılır.
 *
 * ⚠️ **YAPRAK MODÜL — hiçbir şey import etmez.** Politikalar bu listeyi
 * okuyor, erişim modülü (`lib/pageAccess.js`) de politikaları; buradan bir
 * politika import edilseydi döngü kurulur ve `const` bir liste modül
 * yüklenirken TDZ ile düşerdi.
 */

/**
 * ÖNİZLEME EKİBİ — yeni bir sayfayı herkese açmadan önce görenler.
 *
 * İstek (2026-09-28): *"keşfet ve akışım sayfasını sadece cenk, pınar ve
 * hüseyin görsün şimdilik"*.
 *
 * ⚠️ Adresler TAHMİN DEĞİL: tyrotrader'ın doğrulanmış kütüğünden
 * (`src/access/people.ts`, üçü de `verified: true` ve Entra oid'leriyle).
 * Bir harf hatası kişiyi sessizce kapıda bırakır ve ekranda hiçbir iz
 * bırakmaz — eklerken aynı kütükten ya da dizinden doğrulanmalı.
 *
 * Genişletmek: bu listeye bir UPN. Herkese açmak: ilgili politikada
 * `audience: "*"` — liste başka bir sayfanın önizlemesi için yerinde kalır.
 */
export const PREVIEW_UPNS = Object.freeze([
  "omer.gumus@tyrotech.example", // Ömer Gümüş
  "ayse.demir@tyrotech.example", // Ayşe Demir
  "emre.sahin@tyrotech.example", // Emre Şahin
])

/**
 * AKIŞIM'IN KİTLESİ — önizleme ekibi + Akışım'a ÖZEL eklenenler.
 *
 * İstek (2026-09-29): *"Akışım sayfasına Mert Aksoy'e de yetki verelim"* —
 * YALNIZ Akışım; Keşfet'in kitlesi (`PREVIEW_UPNS`) değişmedi. Ortak listeye
 * eklemek onu Keşfet'e (ve Keşfet'teki Etik Hattı'na) da sokardı.
 * ⚠️ Adres tyrotrader'ın doğrulanmış kütüğünden (`ibrahim-Aksoy`,
 * `verified: true`, oid 9668bf37-5f15-4503-89b3-280e5a5cbeae).
 */
export const MYSPACE_UPNS = Object.freeze([
  ...PREVIEW_UPNS,
  "mert.aksoy@tyrotech.example", // Mert Aksoy
])

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase()

/**
 * Bu kitle bu kişiyi kapsıyor mu. Her zaman boolean — FAIL-CLOSED:
 * çözülmemiş yönetici cevabı (`undefined`) ya da "soramadık" (`UNKNOWN`)
 * üye sayılmaz, tanınmayan bir `audience` değeri kimseyi kapsamaz.
 */
export function audienceAllows(audience, { upn, inAdminGroup, isAppAdmin } = {}) {
  if (audience === "*") return true
  if (audience === "admins") return inAdminGroup === true
  // Güvenlik › Yetkiler'de "Yönetici" işaretli kişi; sorulamadıysa kapalı (fail-closed).
  if (audience === "appAdmins") return isAppAdmin === true
  if (Array.isArray(audience)) {
    const me = norm(upn)
    return me !== "" && audience.some((a) => norm(a) === me)
  }
  return false
}

/**
 * Cevap HENÜZ verilemiyor mu. Yalnız `"admins"` kitlesinde ve üyelik sorusu
 * yoldayken doğru: bir rota o arada "hayır" deyip yönlendirseydi, yer imiyle
 * gelen bir yönetici cevap gelmeden sayfadan atılırdı. UPN listesi eşzamanlı
 * okunuyor, orada bekleme hiç olmuyor.
 */
export function audiencePending(audience, { inAdminGroup, isAppAdmin } = {}) {
  if (audience === "appAdmins") return isAppAdmin === undefined
  return audience === "admins" && inAdminGroup === undefined
}
