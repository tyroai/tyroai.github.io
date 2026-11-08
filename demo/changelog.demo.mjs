// "Yenilikler" kataloğunun demo içeriği (kurgusal). Sync, changelog.js ve changelogIndex.js'i buradan üretir.

export const DEMO_CHANGELOG = [
  {
    id: "2026-11-08-demo-yayinda",
    date: "2026-11-08",
    kind: "feature",
    audience: "all",
    route: "/myspace",
    title: { tr: "Demo yayında", en: "Demo is live" },
    body: {
      tr: "Ömer Gümüş'ün satış yöneticisi çalışma alanı, tamamen kurgusal verilerle yayında. Başlıktaki veri seti simgesiyle sektörler arasında geçiş yapabilirsin.",
      en: "Ömer Gümüş's sales manager workspace is live with fully fictional data. Use the dataset icon in the header to switch between industries.",
    },
    points: [
      {
        tr: "Kişi, kurum ve rakamların hepsi uydurma; gerçek bir sisteme bağlı değil",
        en: "People, companies and figures are all made up; nothing is connected to a real system",
      },
      {
        tr: "Ana veri seti ve altı sektör: beyaz eşya, teknoloji, tarım, otomotiv, gıda ve içecek, sağlık",
        en: "A main dataset plus six industries: appliances, technology, agriculture, automotive, food and beverage, healthcare",
      },
    ],
  },
  {
    id: "2026-11-07-sektor-veri-setleri",
    date: "2026-11-07",
    kind: "feature",
    audience: "all",
    route: "/myspace",
    title: { tr: "Sektör veri setleri", en: "Industry datasets" },
    body: {
      tr: "Takvim, posta, görevler, dosyalar ve Keşfet akışı seçtiğin sektöre göre değişir. Ad ve unvan her sette aynı kalır.",
      en: "Calendar, mail, tasks, files and the Discover feed change with the industry you pick. Name and title stay the same in every set.",
    },
  },
  {
    id: "2026-11-05-asistan-sohbeti",
    date: "2026-11-05",
    kind: "improvement",
    audience: "all",
    route: "/chat",
    title: { tr: "Asistan sohbeti", en: "Assistant chat" },
    body: {
      tr: "Asistanlar satış hedefi, fırsat durumu ve haftalık özet gibi sorulara hazır yanıtlarla cevap verir.",
      en: "Assistants answer questions such as sales targets, deal status and the weekly summary with prepared replies.",
    },
  },
  {
    id: "2026-10-28-takvim",
    date: "2026-10-28",
    kind: "improvement",
    audience: "all",
    route: "/calendar",
    title: { tr: "Takvim görünümü", en: "Calendar view" },
    body: {
      tr: "Toplantılar, görevler ve özel günler tek sayfada; bugünden başlayan hafta görünümü açılır.",
      en: "Meetings, tasks and special days on one page, opening on the week that starts today.",
    },
  },
  {
    id: "2026-10-20-gorevler",
    date: "2026-10-20",
    kind: "improvement",
    audience: "all",
    route: "/todo",
    title: { tr: "Görev listeleri", en: "Task lists" },
    body: {
      tr: "Görevleri listelere ayır, bugüne odaklan, tamamlananları gizle.",
      en: "Split tasks into lists, focus on today and hide the completed ones.",
    },
  },
]
