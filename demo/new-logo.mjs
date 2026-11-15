// Yeni "tyro" yazı logosunun çağrı yeri yamaları (Kasım 2026). Bileşenlerin kendisi overlay'de:
// `demo/overlay/src/components/brand/` (BrandText, TyroLogo, TyroAppIcon, TyroOrbGlyph, tyroWordmark),
// `src/lib/logoOrb.js` (küre seçimi), `src/features/profile/ProfilePage/LogoOrbPicker.jsx` ve
// `src/styles/palette-obsidian.css` (Obsidyen paleti).
// Yazı küreyi "o" harfi olarak taşıdığı için eski "işaret + yazı" kilidinde işaret artık yalnız yazı
// gizlenince görünür (daraltılmış kenar çubuğu, ≤360 px giriş başlığı).

const LOGIN_CSS = `
/* ── Yeni logo (demo/new-logo.mjs) ── Yazı küreyi taşır; işaret yalnız yazı gizlenince (≤360 px). */
.login-logo {
  display: none;
}
.login-wordmark {
  height: 2rem;
}
@media (max-width: 640px) {
  .login-wordmark {
    height: 1.5rem;
  }
}
@media (max-width: 360px) {
  .login-wordmark {
    display: none;
  }
  .login-logo {
    display: block;
  }
}
`

const OBSIDIAN_LABEL = { tr: "Obsidyen", en: "Obsidian", ar: "Obsidian", ru: "Obsidian" }

/** `POST_PATCHES`e eklenir (aynı biçim: `find` eşleşmezse sync durur). */
export const NEW_LOGO_PATCHES = [
  // ── Kenar çubuğu: açıkken yalnız yazı (bir kademe küçük), kapalıyken yalnız küre. Kapalıyken
  // gizli yazının aralığı küreyi 3 px sola itiyordu; aralık sıfırlanır, küre menü simgeleriyle hizalanır.
  {
    file: "src/components/layout/Sidebar.jsx",
    find: 'className="flex items-center gap-1.5 py-2 pl-[0.1875rem] pr-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"',
    replace:
      'className="flex items-center gap-1.5 py-2 pl-[0.1875rem] pr-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"',
  },
  {
    file: "src/components/layout/Sidebar.jsx",
    find: '<TyroLogo size={28} className="size-7 shrink-0" aria-hidden="true" />',
    replace:
      '<TyroLogo size={28} className="hidden size-7 shrink-0 group-data-[collapsible=icon]:block group-data-[collapsible=icon]:-translate-x-px" aria-hidden="true" />',
  },
  {
    file: "src/components/layout/Sidebar.jsx",
    find: '<BrandText suffix={inRm ? "RM" : undefined} className="h-5" />',
    replace: '<BrandText suffix={inRm ? "RM" : undefined} className="h-6" />',
  },
  // ── Profil › Görünüm: yazı rengi önizlemesinde işaret yok; altına "Logodaki küre" seçicisi.
  {
    file: "src/features/profile/ProfilePage/WordColorPicker.jsx",
    find: /\s*<TyroLogo size=\{28\} className="size-7 shrink-0" \/>(\s*)<BrandText className="h-5" \/>/,
    replace: (_m, ws) => `${ws}<BrandText className="h-7" />`,
  },
  {
    file: "src/features/profile/ProfilePage/WordColorPicker.jsx",
    find: 'import { TyroLogo } from "@/components/brand/TyroLogo"\n',
    replace: "",
  },
  {
    file: "src/features/profile/ProfilePage/AppearanceSection.jsx",
    find: 'import { WordColorPicker } from "./WordColorPicker"\n',
    replace: 'import { LogoOrbPicker } from "./LogoOrbPicker"\nimport { WordColorPicker } from "./WordColorPicker"\n',
  },
  {
    file: "src/features/profile/ProfilePage/AppearanceSection.jsx",
    find: "      <WordColorPicker />\n",
    replace: "      <WordColorPicker />\n\n      <LogoOrbPicker />\n",
  },
  // ── Uygulama adı arayüzde "tyro": başlık kırıntısının kökü ve `brand.name` ("tyro ai" değil; logo da
  // artık yalnız "tyro"). Önceki kural bunları "tyro ai" yapıyor; burada geri alınır.
  {
    file: "src/components/layout/Header.jsx",
    find: /(hover:opacity-80"\s*>\s*)tyro ai(\s*<\/a>)/,
    replace: (_m, a, b) => `${a}tyro${b}`,
  },
  ...["tr", "en", "ar", "ru"].map((lng) => ({
    file: `src/data/strings.${lng}.js`,
    find: '"brand.name": "tyro ai"',
    replace: '"brand.name": "tyro"',
  })),
  // ── Giriş başlığı
  {
    file: "src/features/auth/login/login.css",
    find: /\s*$/,
    replace: () => `\n${LOGIN_CSS}`,
  },
  // ── Obsidyen paleti: liste, stil dosyası (overlay), adlar ve maskotun üç rengi.
  {
    file: "src/data/palettes.js",
    find: '  {\n    id: "black",',
    replace:
      '  // Obsidyen (demo): logodaki obsidyen kürenin renkleri; siyah cam · grafit mor · leylak ışık.\n  {\n    id: "obsidian",\n    labelKey: "palette.obsidian",\n    swatch: ["#111114", "#3d3560", "#b79cff"],\n    group: "gradient",\n  },\n  {\n    id: "black",',
  },
  // ── Varsayılan palet Obsidyen (kullanıcı kararı, 15 Kas 2026). Palet yalnız kullanıcı seçince
  // yazıldığı için seçmemiş herkes yeni varsayılanı izler; giriş sayfası da varsayılanı giyer.
  // Tarayıcı çubuğu rengi ve yükleme hatası düğmesi de obsidyene döner.
  {
    file: "src/data/palettes.js",
    find: 'export const DEFAULT_PALETTE = "fiesta"',
    replace: 'export const DEFAULT_PALETTE = "obsidian"',
  },
  {
    file: "index.html",
    find: '<meta name="theme-color" content="#dd2a7b" media="(prefers-color-scheme: light)" />',
    replace: '<meta name="theme-color" content="#2a2636" media="(prefers-color-scheme: light)" />',
  },
  {
    file: "index.html",
    find: '"background:#dd2a7b;color:#fff;',
    replace: '"background:#3d3560;color:#fff;',
  },
  {
    file: "src/index.css",
    find: '@import "./styles/brand-solid.css";',
    replace: '@import "./styles/brand-solid.css";\n@import "./styles/palette-obsidian.css";',
  },
  ...Object.entries(OBSIDIAN_LABEL).map(([lng, label]) => ({
    file: `src/data/strings.${lng}.js`,
    find: '"palette.periwinkle": "Periwinkle",',
    replace: `"palette.periwinkle": "Periwinkle",\n  "palette.obsidian": "${label}",`,
  })),
  {
    file: "src/components/brand/mascot/mascotPalette.js",
    find: '  periwinkle: ["#1f223a", "#6d74b5", "#d8dbed"],',
    replace:
      '  periwinkle: ["#1f223a", "#6d74b5", "#d8dbed"],\n  // Obsidyen (demo): gövde siyah cam, baskın grafit mor, açık uç buz leylağı.\n  obsidian: ["#17151f", "#6d5aa8", "#d9ccff"],',
  },
]
