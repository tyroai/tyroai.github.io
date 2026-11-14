// Kaynak uygulamayı bu depoya uyarlayan sync betiğinin herkese açık kuralları.
// Kural: kurum adı, gerçek kişi, kimlik kodu ve gerçek adres BU DOSYAYA düz metin olarak YAZILMAZ.
// Kuruma özgü eşlemeler git'e girmeyen `sync.private.mjs`te; gerçek adlar yalnız özet olarak
// (`leak-denylist.json`) tutulur.
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { DEMO_CHANGELOG } from "../demo/changelog.demo.mjs"
import { DICT_OVERRIDES } from "../demo/dict-overrides.mjs"
import { GROUP_COMPANIES, GROUP_SHORT_NAMES, OFFICE_CITIES_JS } from "../demo/fictional.mjs"
import { productWord } from "../demo/product-word.mjs"
import { tyroWord } from "../demo/logo.mjs"

const priv = await import("./sync.private.mjs").catch(() => null)
if (!priv) {
  console.error("scripts/sync.private.mjs yok (bakımcıya özel, git'e girmez). Sync çalıştırılamaz.")
  process.exit(2)
}

export const SOURCE = priv.SOURCE
export { DICT_OVERRIDES }

/** `git archive HEAD` ile alınan yollar: yalnız commit'li hâl, çalışma kopyasındaki yarım iş değil. */
export const ARCHIVE_PATHS = [
  "src",
  "public",
  "index.html",
  "tsconfig.json",
  "package.json",
  "scripts/vite/buildInfo.mjs",
  "scripts/vite/iconShards.mjs",
]

/** Anlık görüntüden atılanlar (köke göre; klasör ya da dosya). */
export const EXCLUDE = [
  "package.json", // yalnız bağımlılık listesini okumak için alındı
  "public/CNAME",
  "public/robots.txt",
  "public/notify-sw.js",
  "public/radio-logos", // üçüncü taraf logoları; eksikse sahne görsel koleksiyonuna düşer
  "public/images", // gerçek kişi fotoğrafları (yerine demo/overlay avatarları)
  "public/tyra-market",
  // Avans akışının ERP lokasyon listesinden küçük yerleşimler (gerçek şirket yerleşkelerini ele verir): görselleri alınmaz
  "public/tyra-advance/cities/bandirma.webp",
  "public/tyra-advance/cities/corum.webp",
  "public/tyra-advance/cities/giresun.webp",
  "public/tyra-advance/cities/merzifon.webp",
  "public/tyra-stage/lorde-melodrama.webp", // gerçek albüm kapağı: herkese açık depoya girmez
  "src/dev", // geliştirme verisi; yerine demo/overlay saplamaları
]
export const EXCLUDE_PREFIX = priv.EXCLUDE_PREFIX ?? []

/** Pakete girmeyen bağımlılıklar: demo/shims altındaki karşılıklarıyla değişir. */
export const DROP_DEPS = [
  "@azure/msal-browser",
  "@azure/msal-react",
  "@microsoft/agents-copilotstudio-client",
]
/** Kaynağın devDependencies'inden derleme için gerekenler (sürümleri kaynaktan gelir). */
export const KEEP_DEV_DEPS = ["vite", "@vitejs/plugin-react", "@tailwindcss/vite", "shadcn"]

export const TEXT_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".css",
  ".html",
  ".json",
  ".svg",
  ".md",
  ".txt",
])

/**
 * Özgün (dönüşümden ÖNCEKİ) metinde aranan sabit düzeltmeler. Çıpa bulunamazsa sync DURUR:
 * kaynak değişmiş demektir, sessizce atlanmaz. `file` özgün yol adıyla yazılır.
 */
export const PATCHES = [
  {
    file: "index.html",
    find: '<script type="module" src="/src/main.jsx"></script>',
    replace: '<script type="module" src="/demo/entry.jsx"></script>',
  },
  {
    file: "index.html",
    find: "<title>TYRA AI - Kurumsal AI Platformu</title>",
    replace: "<title>TYRO AI - Kurumsal AI Platformu (Demo)</title>",
  },
  // Başlıktaki veri seti seçici (demo/ui/DatasetSwitcher.jsx)
  {
    file: "src/components/layout/Header.jsx",
    find: 'import { ControlCenterGate } from "./control/ControlCenterGate"',
    replace:
      'import { ControlCenterGate } from "./control/ControlCenterGate"\nimport { DatasetSwitcher } from "@demo/ui/DatasetSwitcher"',
  },
  {
    file: "src/components/layout/Header.jsx",
    find: "        <ControlCenterGate />\n",
    replace: "        <DatasetSwitcher />\n        <ControlCenterGate />\n",
  },
  // Köşk görseli yerine sahne koleksiyonu: kesim odağı da görselle birlikte gelir
  {
    file: "src/features/myspace/weather/EstateLayer.jsx",
    find: 'import { estateImage } from "./estateImages"',
    replace: 'import { estateImage, estatePosition } from "./estateImages"',
  },
  {
    file: "src/features/myspace/weather/EstateLayer.jsx",
    find: 'src={estateImage(kind === "partly" && !night ? "sunny" : weather, night)}',
    replace:
      'src={estateImage(kind === "partly" && !night ? "sunny" : weather, night)}\n          style={{ objectPosition: estatePosition(kind === "partly" && !night ? "sunny" : weather, night) }}',
  },
  // (Denetim Merkezi'nde "Çentik" karosu: kaynak bunu #839'da kendisi varsayılandan çıkardı; yama gerekmedi.)
  // Durum noktası: dairesel avatarın KÖŞE kutusuna değil çember kenarına (45°) oturur; büyük avatarda
  // büyür. Kaynakta kutu köşesine konduğu için hero avatarlarında dışarı taşıp garip duruyordu.
  {
    file: "src/components/common/PersonAvatar.jsx",
    find: '"absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-popover",',
    replace:
      '"absolute top-[14.6%] right-[14.6%] size-[max(0.625rem,17%)] translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-popover",',
  },
  // Sahne arka planı demoda HER saatte ve havada açık başlar (kaynakta yalnız güneşli gündüzde).
  {
    file: "src/features/myspace/weather/useEstatePref.js",
    find: 'return typeof saved === "boolean" ? saved : fair',
    replace: 'return typeof saved === "boolean" ? saved : true',
  },
  {
    file: "src/features/widgets/radio/stage/stageArt.js",
    find: '  ["lorde-melodrama", 40, 45],\n',
    replace: "",
  },
  ...priv.PATCHES,
]

// ───────────────────────── metin dönüşümü ─────────────────────────

const sha1 = (s) => createHash("sha1").update(s).digest("hex")
const denylist = JSON.parse(readFileSync(new URL("./leak-denylist.json", import.meta.url), "utf8"))

/** Sync sırasında görülen gerçek kimlik kodlarının özeti (sızıntı denetimi için). */
export const seenGuidHashes = new Set()
export const seenGuidPrefixHashes = new Set()
/** Yorumlarda kısaltılmış (ilk 8 hane) geçen kodlar için: gerçek önek → sahte önek. */
export const prefixMap = new Map()

const GUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
const NIL_GUID = "00000000-0000-0000-0000-000000000000"
function fakeGuid(g) {
  const lower = g.toLowerCase()
  // Boş kimlik kodu ve tek haneli tekrarlar (11111111-…) sır değil, anlamı var: olduğu gibi kalır.
  if (lower === NIL_GUID || /^([0-9a-f])\1{7}-/.test(lower)) return g
  const h = sha1("demo:" + lower)
  const fake = `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
  seenGuidHashes.add(sha1(lower))
  seenGuidPrefixHashes.add(sha1(lower.slice(0, 8)))
  prefixMap.set(lower.slice(0, 8), fake.slice(0, 8))
  return fake
}

const EMAIL_RE = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})\b/g
function mapEmail(m, local, domain) {
  if (!priv.EMAIL_DOMAIN_RE.test(domain)) return m // example.com gibi dış örnekler olduğu gibi
  const mapped = denylist.personMap[sha1(local.toLowerCase())] ?? local
  return `${mapped}@tyrotech.example`
}

const BRAND_RULES = [
  ...priv.BRAND_PRE_RULES,
  // TYRA → TYRO (ürün adı; kimlik, sınıf ve dosya adlarında da aynı kural: tutarlılık için her yerde)
  [/tyra/gi, (m) => (m === "TYRA" ? "TYRO" : m === "Tyra" ? "Tyro" : "tyro")],
]

// "X'nin" → "TYRO'nin" gibi ünlü uyumu bozulan yaygın ekler
const POST_FIXES = [
  [/(TYRO)(['’])nin\b/g, "$1$2nun"],
  [/(TYRO)(['’])yi\b/g, "$1$2yu"],
  // TYRA'yı → TYRO'yı gibi: "o" ile biten ada arka ünlü uyumu (ı → u)
  [/(TYRO|Tyro|tyro)(['’])yı(?![\p{L}])/gu, "$1$2yu"],
  [/(TYRO|Tyro|tyro)(['’])nın(?![\p{L}])/gu, "$1$2nun"],
  [/(TYRO|Tyro|tyro)(['’])ın(?![\p{L}])/gu, "$1$2nun"],
  [/(TYRO Tech)(['’])nun\b/g, "$1$2in"],
]

export function transformText(text) {
  let s = text.replace(EMAIL_RE, mapEmail)
  for (const [re, to] of priv.NAME_RULES ?? []) s = s.replace(re, to)
  for (const [re, to] of priv.HOST_RULES) s = s.replace(re, to)
  s = s.replace(/\ba@b\.com\b/g, "a@b.example")
  s = s.replace(GUID_RE, fakeGuid)
  for (const [re, to] of BRAND_RULES) s = s.replace(re, to)
  for (const [re, to] of POST_FIXES) s = s.replace(re, to)
  // Ürün adı: Tibot → Ticket (yalnız bağımsız sözcük; TibotPage gibi tanımlayıcılara dokunulmaz)
  s = s.replace(/\bTibot(?:lar)?\b/g, "Ticket")
  return s
}

/** Dosya ve klasör adlarına aynı marka kuralı (yol parçası parçası). */
export function transformPath(rel) {
  return rel
    .split("/")
    .map((seg) => {
      let s = seg
      for (const [re, to] of BRAND_RULES) s = s.replace(re, to)
      return s
    })
    .join("/")
}

// ─────────────── dönüşüm SONRASI yamalar ve üretilen dosyalar (kurgusal içerik) ───────────────

const js = (v) => JSON.stringify(v, null, 2)

/** `find` en az bir kez eşleşmek zorunda; eşleşmezse sync durur. */
export const POST_PATCHES = [
  {
    file: "src/data/hrValues.js",
    find: /export const COMPANIES = \{[\s\S]*?\n\}\n/,
    replace: () => `export const COMPANIES = ${js(GROUP_COMPANIES)}\n`,
  },
  {
    file: "src/data/changelog.js",
    find: /export const CHANGELOG = \[[\s\S]*?\n\]\n/,
    replace: () => `export const CHANGELOG = ${js(DEMO_CHANGELOG)}\n`,
  },
  {
    file: "src/data/changelogIndex.js",
    find: /export const CHANGELOG_INDEX = .*\n?/,
    replace: () =>
      `export const CHANGELOG_INDEX = ${JSON.stringify(
        DEMO_CHANGELOG.map(({ id, date, kind, audience, route, to, notify }) => ({
          id,
          date,
          kind,
          audience,
          ...(route ? { route } : {}),
          ...(to ? { to } : {}),
          ...(notify ? { notify } : {}),
        })),
      )}\n`,
  },
  {
    // Logo yazısı: 'a' harfi yerine 'o' (yol verisi, metin değişimi dokunmaz)
    file: "src/components/brand/tyroLogoPaths.js",
    find: /export const WORD =\s*"([^"]+)"/,
    replace: (_m, d) => `export const WORD =\n  "${tyroWord(d)}"`,
  },
  {
    // Logonun ikinci kelimesi "ai" (tyro·ai): paletin renginde, harfler logo üretecinin resmi harfleridir.
    file: "src/components/brand/tyroLogoPaths.js",
    find: /export const WORD_RIGHT = \d+/,
    replace: (m) => `${m}\n\n/** İkinci kelime "ai": \`BrandText\` ek verilmezse bunu çizer (\`demo/product-word.mjs\`). */\nexport const PRODUCT = ${JSON.stringify(productWord())}`,
  },
  {
    file: "src/components/brand/BrandText.jsx",
    find: 'import { SUFFIX, WORD, WORD_BOX, WORD_RIGHT } from "./tyroLogoPaths"',
    replace: 'import { PRODUCT, SUFFIX, WORD, WORD_BOX, WORD_RIGHT } from "./tyroLogoPaths"',
  },
  {
    file: "src/components/brand/BrandText.jsx",
    find: "const extra = suffix ? SUFFIX[suffix] : null",
    replace: "const extra = suffix ? SUFFIX[suffix] : PRODUCT",
  },
  {
    file: "src/components/brand/BrandText.jsx",
    find: 'aria-label={`tyro${suffix ?? ""}`}',
    replace: 'aria-label={`tyro${suffix ?? " ai"}`}',
  },
  {
    file: "src/components/brand/BrandText.jsx",
    find: '{extra ? <path d={extra.d} className="fill-brand" /> : null}',
    replace:
      '{extra ? <path d={extra.d} className="fill-brand" fillRule={extra === PRODUCT ? "nonzero" : undefined} /> : null}',
  },
  // Header'ın sağ ucundaki "Sohbeti yan panelde aç" düğmesi: gradyanlı robot simgesi yerine doğrudan TYRO küresi
  // (sohbet çubuğundakiyle aynı `BrandOrb`). Boy komşu düğmelerle aynı 36 px; küre onlardan büyük olmaz.
  {
    file: "src/components/layout/Header.jsx",
    find: 'import { cn } from "@/lib/utils"',
    replace: 'import { cn } from "@/lib/utils"\nimport { BrandOrb } from "@/components/brand/BrandOrb"',
  },
  {
    file: "src/components/layout/Header.jsx",
    find: /"size-8 shrink-0 rounded-full p-0[\s\S]*?"shadow-sm transition hover:brightness-110 hover:text-brand-on-ramp",/,
    replace:
      '"size-9 shrink-0 rounded-full border-0 bg-transparent p-0 shadow-none [min-height:36px] [min-width:36px]",\n' +
      '                "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1 transition hover:bg-transparent",',
  },
  {
    file: "src/components/layout/Header.jsx",
    find: /\{tyroIcon\}\s*<\/Button>/,
    replace:
      '<span aria-hidden="true" inert className="pointer-events-none grid size-9 place-items-center">\n' +
      '                <BrandOrb surface="dashboard" state="idle" mascotState="idle" size={22} reading />\n' +
      '              </span>\n' +
      '            </Button>',
  },
  // Uygulama adı "tyro ai": başlık kırıntısının kökü ve marka dizeleri (ad kodlarda "tyroAI" ya da "tyro" yazıyordu).
  {
    file: "src/components/layout/Header.jsx",
    find: /(hover:opacity-80"\s*>\s*)tyro(\s*<\/a>)/,
    replace: (_m, a, b) => `${a}tyro ai${b}`,
  },
  ...["tr", "en", "ar", "ru"].flatMap((lng) => [
    { file: `src/data/strings.${lng}.js`, find: /"brand\.name": "[^"]*"/, replace: '"brand.name": "tyro ai"' },
    { file: `src/data/strings.${lng}.js`, find: /"brand\.fullName": "[^"]*"/, replace: '"brand.fullName": "TYRO AI · TYRO Tech"' },
  ]),
  // Avans akışının "gidilecek yer" listesi ERP'nin gerçek lokasyon listesi: küçük yerleşimler (Bandırma, Çorum, Giresun,
  // Merzifon) şirketin gerçek yerleşkelerini ele verir. Dünya saati listesinden zaten çıkarılmıştı; burada da çıkar.
  {
    file: "src/lib/advanceLocations.js",
    find: /^ {2}"(?:BANDIRMA|ÇORUM|GİRESUN|MERZİFON)",\n/gm,
    replace: "",
  },
  {
    file: "src/features/myspace/flows/advance/lib/cityPhotos.js",
    find: /^ {2}(?:BANDIRMA|ÇORUM|GİRESUN|MERZİFON): \{[^\n]*\},\n/gm,
    replace: "",
  },
  {
    file: "src/features/myspace/flows/advance/lib/turkeyMap.ts",
    find: /^ {2}(?:BANDIRMA|ÇORUM|GİRESUN|MERZİFON): \[[^\n]*\],\n/gm,
    replace: "",
  },
  {
    // Dünya saati koordinatları: katalogdan çıkarılan şehirlerin satırları da gider.
    file: "src/data/cityGeo.js",
    find: /^ {2}(?:corum|bandirma|giresun|karacabey|mus|tekirdag|"buffalo-mo"|basra): \[[^\n]*\],\n/gm,
    replace: "",
  },
  {
    file: "public/tyro-advance/credits.txt",
    find: /^[^\n]*\((?:bandirma|corum|giresun|merzifon)\.webp\)\n(?: {2}[^\n]*\n)*\n?/gm,
    replace: "",
  },
  // Sahne seçici hapı (Sabah · 06:00–10:00 …): gri zemin yerine dinlenirken zeminsiz, çizgisiz ve gölgesiz (yalnız ok); üzerine gelince ve menü açıkken beyaz zemin, hafif kabartma ve gölge.
  {
    file: "src/features/myspace/scenes/sceneStrip.css",
    find: "  background: color-mix(in oklab, var(--foreground) 4.5%, transparent);\n  outline: none;\n  transition: background-color 160ms ease;",
    replace:
      "  background: transparent;\n  box-shadow: none;\n  outline: none;\n  transition:\n    background-color 160ms ease,\n    box-shadow 160ms ease,\n    transform 160ms ease;",
  },
  {
    file: "src/features/myspace/scenes/sceneStrip.css",
    find: '.scs-pick[data-state="open"] {\n  background: color-mix(in oklab, var(--foreground) 8%, transparent);\n}',
    replace:
      '.scs-pick[data-state="open"] {\n  background: var(--card);\n  box-shadow: 0 6px 20px rgb(0 0 0 / 0.09);\n  transform: translateY(-1px);\n}',
  },
  {
    file: "src/features/myspace/scenes/sceneStrip.css",
    find: "  .scs-pick:hover {\n    background: color-mix(in oklab, var(--foreground) 7%, transparent);\n  }",
    replace:
      "  .scs-pick:hover {\n    background: var(--card);\n    box-shadow: 0 6px 18px rgb(0 0 0 / 0.08);\n    transform: translateY(-1px);\n  }",
  },
  // "Sahneyi düzenle" (seçici düzeninde): gri hap yerine zeminsiz, düz palet renkli yazı (sekmeler düzenindeki gibi); üzerine
  // gelince zemin çıkmaz, yazı biraz silikleşir.
  {
    file: "src/features/myspace/scenes/sceneStrip.css",
    find: '.scn[data-strip="tabs"] .scn-edit:not([data-editing]) {\n  background: transparent;\n  color: var(--brand-text);\n}',
    replace:
      '.scn[data-strip="tabs"] .scn-edit:not([data-editing]),\n.scn[data-strip="picker"] .scn-edit:not([data-editing]) {\n  background: transparent;\n  color: var(--brand-text);\n}',
  },
  {
    file: "src/features/myspace/scenes/sceneStrip.css",
    find: '  .scn[data-strip="tabs"] .scn-edit:not([data-editing]):hover {\n    background: color-mix(in oklab, var(--foreground) 6%, transparent);\n  }',
    replace:
      '  .scn[data-strip="tabs"] .scn-edit:not([data-editing]):hover {\n    background: color-mix(in oklab, var(--foreground) 6%, transparent);\n  }\n  .scn[data-strip="picker"] .scn-edit:not([data-editing]):hover {\n    background: transparent;\n    opacity: 0.75;\n  }',
  },
  // Kutlamalar (doğum günü, iş yıl dönümü, yeni katılan): kaynak yalnız kurumsal alan adlı adresleri alır. Metin dönüşümü
  // o alan adını "www.tyrotech.example" yapıyordu; demo adresleri "@tyrotech.example", bu yüzden hepsi eleniyor,
  // Bildirimler hep "her şey sakin" diyordu.
  {
    file: "src/lib/celebrations.js",
    find: 'mail.endsWith("@www.tyrotech.example")',
    replace: 'mail.endsWith("@tyrotech.example")',
  },
  // Giriş sayfası (yalnız orada): marka satırı altında "powered by TYRO Tech"; alt bilgi yalnız telif.
  ...["tr", "en", "ar", "ru"].flatMap((lng) => [
    {
      file: `src/data/strings.${lng}.js`,
      find: /"login\.subBrand": "[^"]*"/,
      replace: '"login.subBrand": "powered by TYRO Tech"',
    },
    {
      file: `src/data/strings.${lng}.js`,
      find: '"login.copyright": "© {year} Powered by TYRO Tech Business Solutions · tyroAI"',
      replace: '"login.copyright": "© {year} TYRO Tech"',
    },
  ]),
  {
    file: "src/data/worldCities.js",
    find: /export const OFFICE_CITIES = \[[\s\S]*?\n\]\n/,
    replace: () => OFFICE_CITIES_JS,
  },
  {
    file: "src/data/worldCities.js",
    find: /^ {2}\["(?:corum|bandirma|giresun|karacabey|mus|tekirdag|buffalo-mo|basra)",.*\n/gm,
    replace: "",
  },
]

/** Tamamen üretilen dosyalar (dönüştürülmüş kaynağın üstüne yazılır). */
export const GENERATED_FILES = {
  "src/data/companyShortNames.js": () =>
    `/** Şirket kısa adları (kurgusal grup): kod → [ekranda yazılan ad, ERP'deki tam ünvan]. */\nexport const COMPANY_SHORT_NAMES = ${js(GROUP_SHORT_NAMES)}\n`,
}
