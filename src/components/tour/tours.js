/**
 * Rehber turlarının tanımları. Adım: `{ id, targets, items, since?, side? }` — `targets` hedef
 * adları (`tourGeometry`), `items` madde anahtarları ya da `(görünen hedefler, dil)` ile anahtar
 * veren işlev (`null` → madde yok), `since` adımın geldiği sürüm (eski sürümü görene yalnız yeniler
 * gösterilir), `side` pencere içi ipucunda balonun yönü (`CoachTour`; yoksa alt).
 * Metinler `tour.<tur>.<adım>.title|<madde>`. Sürümü büyütmek turu herkese bir kez daha açar —
 * yalnız gerçekten yeni bir şey anlatılacaksa.
 *
 * Sayfa turları (`Tour`): home, selfservice, feed, todo, calendar, chat; düzenleme kipi: home-edit.
 * Pencere içi ipuçları (`CoachTour`): request-leave, request-expense, request-advance, narrate.
 *
 * Yazım kuralı: bariz olanı anlatma ("bu bir düğme"); keşfedilmesi zor olanı söyle (dokun, sürükle,
 * kısayol, gizli menü) — ürün sahibinin ilkesi.
 */
import "@/lib/i18n/tour"
const ifShown =
  (name, key = name) =>
  (shown) =>
    shown.includes(name) ? key : null
// Anlat yalnız Türkçe: onu anlatan madde öteki dillerde düşer.
const ifLocale = (lang, key) => (shown, locale) => (locale === lang ? key : null)
// Fareyle (üstüne gelme, kenardan sürükleme) çalışan özellik dokunmatikte anlatılmaz.
const fine = () => Boolean(window.matchMedia?.("(pointer: fine)").matches)
const ifFine = (key) => () => (fine() ? key : null)

// Talep formunun gönderme adımı: "Ne olacak?" + Anlat düğmesi (Anlat yalnız Türkçede var).
const sendStep = (first) => ({
  id: "send",
  side: "top",
  targets: ["req-next", "req-narrate"],
  items: [first, "draft", ifShown("req-narrate", "narrate")],
})

export const TOURS = {
  home: {
    version: 4,
    steps: [
      {
        id: "start",
        targets: ["welcome", ["brief", "widget:brief"]],
        items: ["item1", "item2", "item3"],
      },
      { id: "ask", targets: ["ask"], items: ["item1", "item2", "item3"] },
      {
        id: "cards",
        targets: ["meeting", "rhythm", "focus", "helporb"],
        items: [ifShown("meeting"), ifShown("rhythm"), ifShown("focus"), ifShown("helporb")],
      },
      { id: "edit", since: 3, targets: ["home-edit"], items: ["item1", "item2", "item3"] },
      { id: "apps", targets: ["apps"], items: ["item1", "item2", "item3"] },
      {
        id: "header",
        since: 3,
        targets: [["nav", "nav-trigger"], "search", "tray", "notch"],
        // Çentik yalnız masaüstünde; telefonda aynı paneller üst çubukta.
        items: [
          "nav",
          "search",
          ifShown("tray"),
          (shown) => (shown.includes("notch") ? "notch" : "notchNarrow"),
        ],
      },
      // Denetim Merkezi (çanın solunda): turu görmüş olana yalnız bu adım bir kez daha.
      { id: "control", since: 4, targets: ["control"], items: ["item1", "item2"] },
    ],
  },
  // Düzenleme kipi ilk kez açılınca (Anasayfa ya da Pano).
  "home-edit": {
    version: 1,
    delay: 600,
    steps: [
      { id: "bar", targets: ["edit-bar"], items: ["item1", "item2", "item3"] },
      { id: "card", targets: ["edit-card"], items: ["item1", "item2", "item3"] },
      { id: "add", targets: ["edit-add"], items: ["item1"] },
      { id: "tray", targets: ["tray"], items: ["item1", "item2"] },
    ],
  },
  selfservice: {
    version: 1,
    steps: [
      { id: "summary", targets: ["ss-summary"], items: ["item1", "item2", "item3"] },
      { id: "team", targets: ["ss-team"], items: ["item1", "item2"] },
      { id: "new", targets: ["ss-new"], items: ["item1", ifLocale("tr", "narrate")] },
      { id: "find", targets: ["ss-tools"], items: ["item1", ifFine("slash")] },
      {
        id: "records",
        targets: ["ss-records", "ss-alerts", "ss-report"],
        items: [
          ifShown("ss-records", "row"),
          (shown) => (shown.includes("ss-records") && fine() ? "hover" : null),
          ifShown("ss-alerts", "alerts"),
          ifShown("ss-report", "report"),
        ],
      },
    ],
  },
  feed: {
    version: 1,
    steps: [
      { id: "tabs", targets: ["feed-tabs"], items: ["agenda", "important", "docs"] },
      { id: "stories", targets: ["feed-stories"], items: ["item1", "item2"] },
      { id: "post", targets: ["feed-actions"], items: ["item1", "item2", "item3"] },
      {
        id: "tools",
        targets: [["feed-tools", "feed-tools-narrow"]],
        items: [(shown) => (shown.includes("feed-tools") ? "wide" : "narrow")],
      },
      { id: "rail", targets: ["feed-trends"], items: ["trends"] },
    ],
  },
  todo: {
    version: 1,
    steps: [
      {
        id: "summary",
        targets: [["todo-status", "todo-kpi"]],
        items: [(shown) => (shown.includes("todo-status") ? "tiles" : "kpi"), "sync"],
      },
      // Dar kapta ray yerine çip şeridi: orada yeni liste ve liste menüsü yok.
      {
        id: "views",
        targets: [["todo-views", "todo-views-strip"]],
        items: ["item1", ifShown("todo-views", "item2")],
      },
      { id: "add", targets: ["todo-add"], items: ["item1"] },
      { id: "tasks", targets: ["todo-list"], items: ["item1", "item2", "item3"] },
    ],
  },
  // Takvim (yalnız yöneticiler): kısayollar ve boş yere basınca ekleme fareyle, dokunmatikte yok.
  calendar: {
    version: 1,
    steps: [
      { id: "tools", targets: ["cal-tools"], items: [ifFine("item1"), "item2"] },
      { id: "layers", targets: ["cal-layers"], items: ["item1", "item2"] },
      { id: "add", targets: ["cal-new"], items: [ifFine("item1"), "item2"] },
    ],
  },
  // Sohbet boş ekrandan konuşmaya hızla geçip besteciyi yeniden kurabiliyor: biraz geç başlar.
  chat: {
    version: 1,
    delay: 1800,
    steps: [
      { id: "composer", targets: ["chat-composer"], items: ["item1"] },
      {
        id: "tools",
        targets: ["chat-plus", "chat-mic"],
        items: ["plus", ifShown("chat-mic", "mic")],
      },
      { id: "agent", targets: ["chat-agent"], items: ["item1", "item2"] },
      { id: "panel", targets: ["chat-dock"], items: ["item1", ifFine("item2")] },
    ],
  },
  // Talep formu ilk kez açılınca, türüne göre (pencerenin ya da çekmecenin içinde).
  "request-leave": {
    version: 1,
    delay: 700,
    steps: [
      {
        id: "calendar",
        targets: ["req-calendar", "req-team"],
        items: ["item1", ifShown("req-team", "team")],
      },
      { id: "impact", targets: ["req-impact"], items: ["item1", "item2", "item3"] },
      sendStep("next"),
    ],
  },
  "request-expense": {
    version: 1,
    delay: 700,
    steps: [
      { id: "receipts", targets: ["req-receipts"], items: ["item1", "item2"] },
      { id: "lines", targets: ["req-lines"], items: ["item1", "item2"] },
      sendStep("review"),
    ],
  },
  "request-advance": {
    version: 1,
    delay: 700,
    steps: [{ id: "hints", targets: ["req-hints"], items: ["item1"] }, sendStep("next")],
  },
  // Anlat kutusu ilk kez açılınca (Yeni menüsü, telefonun Anlat çekmecesi ya da formun Anlat'ı).
  narrate: {
    version: 1,
    delay: 500,
    steps: [
      {
        id: "field",
        side: "top",
        targets: ["narrate", "req-narrate"],
        items: ["item1", "chips", (shown) => (shown.includes("req-narrate") ? "form" : "menu")],
      },
    ],
  },
}
