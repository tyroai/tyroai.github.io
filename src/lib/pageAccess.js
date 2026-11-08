import { CALENDAR_PAGE } from "@/lib/calendarPolicy"
import { FEED } from "@/lib/feedPolicy"
import { MYSPACE } from "@/lib/myspacePolicy"
import { TODO_PAGE } from "@/lib/todoPolicy"
import { TIBOT } from "@/lib/tibotPolicy"
import { SELF_SERVICE_PAGE } from "@/lib/selfServicePolicy"
import { SOLUTIONS_PAGE } from "@/lib/solutionsPolicy"
import { HOME_EDIT, WIDGETS_PAGE } from "@/lib/widgetsPolicy"
import { audienceAllows, audiencePending } from "@/lib/audience"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  SAYFA ERİŞİMİ — kitlesi daraltılmış sayfalar, TEK kapı
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Üç sayfa bugün kendi kitlesini taşıyor: Keşfet (`/feed`, `FEED`), Akışım
 * (`/myspace`, `MYSPACE`) ve To-Do (`/todo`, `TODO_PAGE`). Gerisi herkese
 * açık. Güvenlik (`/security`) yalnız uygulama yöneticilerine: Yetkiler'de "Yönetici" işaretli
 * kişi (`tyro_isadmin`); Entra yönetici grubu YETMEZ — kullanıcı menüsü, arama ve paletle aynı
 * soru; yönetici olmayan adresi yazsa da sayfayı görmez, Anasayfa'ya düşer. Katalog sekmesi kendi
 * kapısını Profilim'de taşır.
 *
 * ⚠️ **NEDEN TEK MODÜL.** Bir sayfaya giden yol bir tane değil: sidebar
 * satırı · header araması · komut paleti · dashboard'daki "Keşfete göz at" ·
 * Akışım'daki Keşfet bağlantısı · sidebar rozeti · Yenilikler kaydının
 * "Yeniliği keşfet" düğmesi · düpedüz adres. Her birine ayrı koşul yazmak,
 * yedincisinde birini unutmak demekti (sohbet kilidinde yaşandı: kilit
 * seçimi süzüyordu, yüzeyi değil). Hepsi `canOpen(path)`a soruyor.
 *
 * ⚠️ **`canOpen` TANIMADIĞI ADRESE "AÇIK" DER.** Soru "bu sayfa kısıtlı mı
 * ve sen dışarıda mısın" — uygulamanın geri kalanını buradan kapatmak
 * mümkün değil, ve olmamalı.
 */

/** `/feed?tag=ik#x` → `/feed`. Yenilikler kayıtlarının `to`su sorgu taşıyor. */
export function pathOf(to) {
  const s = String(to ?? "")
  const cut = s.search(/[?#]/)
  return (cut === -1 ? s : s.slice(0, cut)) || "/"
}

/**
 * Bu kişi için kararlar. `who` = `{ upn, inAdminGroup, isAppAdmin }` — `upn` MSAL
 * `username`i, `inAdminGroup` `useIsInGroup`un, `isAppAdmin` `useIsAppAdmin`in cevabı.
 *
 * Dönen: `{ feed, myspace, todo, selfService, calendar, widgets, solutions, security, homeEdit, tibot, home, pending: {…}, canOpen(to) }`.
 * `home`: kapıda kalan kişinin düşeceği sayfa — kendisi kapalı olamaz (yönlendirme döngüsü).
 * `pending` yalnız `"admins"` kitlesinde ve cevap yoldayken doğru: rota o
 * arada yönlendirmez, hiçbir şey çizmez.
 */
export function pageAccessFor(who) {
  const feed = FEED.enabled && audienceAllows(FEED.audience, who)
  const myspace = MYSPACE.enabled && audienceAllows(MYSPACE.audience, who)
  const todo = TODO_PAGE.enabled && audienceAllows(TODO_PAGE.audience, who)
  const selfService = SELF_SERVICE_PAGE.enabled && audienceAllows(SELF_SERVICE_PAGE.audience, who)
  const calendar = CALENDAR_PAGE.enabled && audienceAllows(CALENDAR_PAGE.audience, who)
  const widgets = WIDGETS_PAGE.enabled && audienceAllows(WIDGETS_PAGE.audience, who)
  const solutions = SOLUTIONS_PAGE.enabled && audienceAllows(SOLUTIONS_PAGE.audience, who)
  // Güvenlik: yalnız Yetkiler'deki yönetici işareti (fail-closed; cevap yoldayken bekler).
  const security = audienceAllows("appAdmins", who)
  // Ticket sayfası (`/tibot`) ve Ticket widget'ları: aynı kitle.
  const tibot = TIBOT.enabled && audienceAllows(TIBOT.audience, who)
  // Sayfa değil, Anasayfa'nın düzenlenebilirliği: rota kapısı yok.
  const homeEdit = HOME_EDIT.enabled && audienceAllows(HOME_EDIT.audience, who)
  const pending = {
    feed: FEED.enabled && audiencePending(FEED.audience, who),
    myspace: MYSPACE.enabled && audiencePending(MYSPACE.audience, who),
    todo: TODO_PAGE.enabled && audiencePending(TODO_PAGE.audience, who),
    selfService: SELF_SERVICE_PAGE.enabled && audiencePending(SELF_SERVICE_PAGE.audience, who),
    calendar: CALENDAR_PAGE.enabled && audiencePending(CALENDAR_PAGE.audience, who),
    widgets: WIDGETS_PAGE.enabled && audiencePending(WIDGETS_PAGE.audience, who),
    solutions: SOLUTIONS_PAGE.enabled && audiencePending(SOLUTIONS_PAGE.audience, who),
    security: audiencePending("appAdmins", who),
    tibot: TIBOT.enabled && audiencePending(TIBOT.audience, who),
  }
  const gated = new Map([
    ["/feed", feed],
    ["/myspace", myspace],
    ["/todo", todo],
    ["/self-service", selfService],
    ["/tibot", tibot],
    ["/calendar", calendar],
    ["/widgets", widgets],
    ["/dashboard", solutions],
    ["/security", security],
    ["/authorizations", security],
  ])
  const canOpen = (to) => gated.get(pathOf(to)) ?? true
  const home = myspace ? "/myspace" : solutions ? "/dashboard" : "/help"
  return {
    feed,
    myspace,
    todo,
    selfService,
    calendar,
    widgets,
    solutions,
    security,
    homeEdit,
    tibot,
    home,
    pending,
    canOpen,
  }
}
