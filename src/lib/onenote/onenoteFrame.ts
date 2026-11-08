import { FRAME_CSP } from "@/lib/mailFrame"

/**
 * OneNote okuyucusunun çerçeve belgesi — Apple Notlar / Mail okuma yüzeyi: sistem yazısı,
 * ~68 karakterlik satır, ferah paragraf ve başlık payı, yuvarlak köşeli görsel, ince çizgili
 * tablo. Postanın çerçevesinden (`lib/mailFrame`) ayrı: posta kendi tasarımını beyaz kâğıtta
 * taşır, not ise uygulamanın temasında okunur (koyu temada koyu).
 *
 * Güvenlik aynı: `FRAME_CSP` (görsel yalnız `data:`, betik yok), bağlantılar yeni sekmede.
 * Zemin SAYDAM: bölmenin kart rengi görünür. Bunun için çerçevenin `color-scheme`i dış
 * sayfadakiyle aynı olmalı (`onenoteReader.css` › `.on-reader-frame`), yoksa tarayıcı
 * opak zemin boyar.
 */

export interface FrameOptions {
  /** Dipnot (çağıran çevirir; çerçeveye `useLocale` ulaşmaz). */
  note?: string
  dark?: boolean
  /** Bağlantı ve işaret rengi: paletin `brand-ink`i (çözülmüş renk). */
  link?: string | null
}

const INK = {
  light: {
    ink: "#1d1d1f",
    soft: "#6e6e73",
    rule: "rgba(0,0,0,.1)",
    fill: "rgba(0,0,0,.035)",
    box: "#aeaeb2",
    link: "#0a66d6",
    shadow: "0 1px 2px rgba(0,0,0,.06),0 6px 20px rgba(0,0,0,.07)",
  },
  dark: {
    ink: "#f5f5f7",
    soft: "#a1a1a6",
    rule: "rgba(255,255,255,.13)",
    fill: "rgba(255,255,255,.06)",
    box: "#8e8e93",
    link: "#6cb4ff",
    shadow: "0 1px 2px rgba(0,0,0,.4),0 6px 20px rgba(0,0,0,.35)",
  },
}

/** Dışarıdan gelen renk yalnız renk sözdizimiyse kullanılır (CSS'e sızma yok). */
const safeColor = (value: string | null | undefined): string | null =>
  value &&
  /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|color)\([0-9a-z.,%/\s-]+\))$/i.test(value.trim())
    ? value.trim()
    : null

const escapeText = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const CHECK = (stroke: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='${encodeURIComponent(stroke)}' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 8.4 2.6 2.6L12 5.4'/%3E%3C/svg%3E`
const PHOTO = (stroke: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='${encodeURIComponent(stroke)}' stroke-width='1.6' viewBox='0 0 24 24'%3E%3Crect x='3' y='4' width='18' height='16' rx='3'/%3E%3Ccircle cx='9' cy='10' r='2'/%3E%3Cpath d='m21 16-5-5-9 9'/%3E%3C/svg%3E`

export function oneNoteFrameDoc(html: string, { note, dark = false, link }: FrameOptions = {}) {
  const c = dark ? INK.dark : INK.light
  const accent = safeColor(link) ?? c.link
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">
<meta name="color-scheme" content="${dark ? "dark" : "light"}">
<base target="_blank">
<style>
:root{color-scheme:${dark ? "dark" : "light"}}
html{-webkit-text-size-adjust:100%}
html,body{margin:0;background:transparent}
body{padding:24px 24px 48px;color:${c.ink};
  font:15px/1.6 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI Variable Text","Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-wrap:break-word}
@media (max-width:480px){body{padding:20px 20px 32px}}
.on-page{max-width:68ch}
:where(.on-page *){max-width:100%;box-sizing:border-box}
::selection{background:color-mix(in srgb,${accent} 28%,transparent)}
/* OneNote'un her not kutusu bir div: kutular arası nefes. */
.on-page>div+div{margin-top:1.75em}
.on-page>:first-child,.on-page>:first-child>:first-child{margin-top:0}
p{margin:0 0 .6em}
h1,h2,h3,h4,h5,h6{margin:1.5em 0 .5em;font-weight:650;line-height:1.25;letter-spacing:-.012em}
h1{font-size:1.4em;font-weight:700}h2{font-size:1.22em}h3{font-size:1.1em}h4,h5,h6{font-size:1em}
b,strong{font-weight:600}
cite{color:${c.soft};font-size:.9em;font-style:normal}
ul,ol{margin:.25em 0 .9em;padding-inline-start:1.5em}
li{margin:.3em 0;padding-inline-start:.2em}
li::marker{color:${c.soft}}
li>p{margin:0}
a{color:${accent};text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:2px}
img{display:block;max-width:100%;height:auto;margin:1em 0;border-radius:10px;box-shadow:${c.shadow}}
table{display:block;width:max-content;max-width:100%;overflow-x:auto;margin:1em 0;
  border:1px solid ${c.rule};border-radius:10px;border-collapse:separate;border-spacing:0;font-size:.94em}
td,th{padding:8px 12px;vertical-align:top;text-align:start;border-bottom:1px solid ${c.rule};border-inline-end:1px solid ${c.rule}}
tr:last-child>td,tr:last-child>th{border-bottom:0}
td:last-child,th:last-child{border-inline-end:0}
th{font-weight:600;background:${c.fill}}
td>p:last-child,th>p:last-child{margin-bottom:0}
blockquote{margin:1em 0;padding-inline-start:14px;border-inline-start:3px solid ${c.rule};color:${c.soft}}
hr{border:0;border-top:1px solid ${c.rule};margin:1.6em 0}
pre,code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em}
pre{white-space:pre-wrap;padding:12px 14px;border-radius:10px;background:${c.fill}}
/* Vurgu (fosforlu kalem) açık zeminli: koyu temada da yazısı koyu kalsın. */
span[style*="background"]{color:#1d1d1f;border-radius:3px;padding:0 .12em}
/* OneNote etiketleri: yapılacak kutusu (tamamlanınca dolu, üstü çizili) ve önemli yıldızı. */
[data-tag^="to-do"]{list-style:none;position:relative;padding-inline-start:1.75em}
li[data-tag^="to-do"]{margin-inline-start:-1.5em}
[data-tag^="to-do"]::before{content:"";position:absolute;inset-inline-start:0;top:.28em;
  width:1.05em;height:1.05em;border:1.5px solid ${c.box};border-radius:.3em;box-sizing:border-box}
[data-tag*="to-do:completed"]::before{border-color:${accent};background:${accent} url("${CHECK(dark ? "#1d1d1f" : "#fff")}") center/100% no-repeat}
[data-tag*="to-do:completed"]{color:${c.soft};text-decoration:line-through;text-decoration-color:${c.rule}}
[data-tag^="important"]::before{content:"★ ";color:#e8a20c}
/* İndirilemeyen görsel: kendi oranında sakin kutu, başlığı (alt) ortada. */
.on-img-missing{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  width:100%;min-height:96px;max-height:220px;margin:1em 0;padding:12px;border-radius:10px;border:1px dashed ${c.rule};
  background:${c.fill};color:${c.soft};font-size:13px;line-height:1.35;text-align:center}
.on-img-missing::before{content:"";width:24px;height:24px;background:url("${PHOTO(c.soft)}") center/24px no-repeat;opacity:.8}
.on-img-missing>span{overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap}
.on-note{margin:2em 0 0;padding:10px 14px;border-radius:10px;background:${c.fill};color:${c.soft};font-size:13px;line-height:1.5}
</style></head><body><main class="on-page">${html}${
    note ? `<p class="on-note">${escapeText(note)}</p>` : ""
  }</main></body></html>`
}
