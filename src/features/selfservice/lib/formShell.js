/**
 * Basılı formların ORTAK kabuğu (izin ve masraf formu): tema, sayfa iskeleti, ERP biçimleri.
 *
 * ⚠️ İzin formu HR MCP'nin kopyası (`tyro-hr-mcp` › `services/form_theme.py`, `leave_form.py`):
 * sohbetten inen izin formu ile buradan basılan aynı kâğıt olmalı. Masraf formu ise Self Servis'e
 * özgü (`expenseFormSheet.js`), HR MCP'nin `expense_form.py`'sinden ayrıştı.
 *
 * Saf metin işlemi (DOM yok): birim testlerinde Node'da çalışır.
 */

const FONT =
  "Inter,'Segoe UI Variable Text','Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif"

const THEME_CSS =
  "@page{size:A4 landscape;margin:12mm}" +
  ":root{--ink:#0f172a;--muted:#64748b;--faint:#94a3b8;--hair:#e2e8f0;--navy:#004579;" +
  "--cyan:#00aeca;--lime:#c7d300}" +
  "*{box-sizing:border-box}" +
  "html{-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
  `body{margin:0;background:#f1f4f8;color:var(--ink);font:14px/1.45 ${FONT};` +
  "-webkit-font-smoothing:antialiased}" +
  ".sheet{position:relative;overflow:hidden;width:273mm;margin:24px auto;padding:12mm 13mm 9mm;" +
  "background:#fff;border-radius:18px;" +
  "box-shadow:0 1px 2px rgba(15,23,42,.04),0 18px 48px -12px rgba(15,23,42,.14)}" +
  ".sheet:before{content:'';position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(" +
  "90deg,var(--navy) 0 64%,var(--cyan) 64% 86%,var(--lime) 86% 100%)}" +
  ".hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10mm;margin-bottom:7mm}" +
  // Rozet (izin türü / masraf no) başlığın hemen yanında, bir boşlukla.
  ".ttl{display:flex;align-items:center;flex-wrap:wrap;gap:4mm}" +
  "h1{margin:0;font-size:27px;font-weight:650;letter-spacing:-.02em}" +
  ".sub{margin:1.5mm 0 0;color:var(--muted);font-size:13.5px}" +
  ".pill{flex:none;padding:6px 14px;border-radius:999px;background:rgba(199,211,0,.16);" +
  "color:var(--navy);font-size:13px;font-weight:600;box-shadow:inset 0 0 0 1px rgba(0,69,121,.12)}" +
  ".hero{display:grid;grid-template-columns:repeat(3,1fr);margin-bottom:8mm;border-radius:14px;" +
  "background:linear-gradient(135deg,#f6fafc,#eaf4f8);box-shadow:inset 0 1px 0 #fff," +
  "inset 0 0 0 1px rgba(0,69,121,.07)}" +
  ".hero div{padding:5mm 6mm}.hero div+div{border-left:1px solid rgba(0,69,121,.09)}" +
  ".k{display:block;color:var(--muted);font-size:11.5px;font-weight:500}" +
  ".big{display:block;margin-top:1.5mm;font-size:22px;font-weight:650;letter-spacing:-.015em;" +
  "font-variant-numeric:tabular-nums}" +
  ".big small{margin-left:2mm;color:var(--muted);font-size:15px;font-weight:500}" +
  ".cols{display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-bottom:8mm}" +
  "h2{margin:0 0 1mm;color:rgba(0,69,121,.7);font-size:11px;font-weight:600;letter-spacing:.08em;" +
  "text-transform:uppercase}" +
  ".empty{color:var(--faint)!important;font-weight:400!important}" +
  ".print{position:fixed;top:18px;right:18px;padding:10px 20px;border:0;border-radius:999px;" +
  `background:var(--navy);color:#fff;font:600 14px ${FONT};cursor:pointer;` +
  "box-shadow:0 8px 24px -6px rgba(0,69,121,.45)}" +
  ".print:hover{background:#013b62}" +
  "@media print{body{background:#fff}.sheet{width:auto;margin:0;padding:2mm 1mm 0;" +
  "border-radius:0;box-shadow:none}.print{display:none}}"

// Kutulu bölüm + etiket | değer satırı (ERP'nin basılı düzeni): izin ve masraf formu ortak.
// Kutunun içi beyaz; başlık şeridine renk veren form kendi CSS'inde verir.
export const BOX_CSS =
  ".box{margin-bottom:6mm;border:1px solid var(--hair);border-radius:10px;overflow:hidden;" +
  "break-inside:avoid}" +
  ".box h2{margin:0;padding:2.3mm 4mm;border-bottom:1px solid var(--hair)}" +
  ".f{display:grid;grid-template-columns:60mm 1fr}" +
  ".f+.f{border-top:1px solid var(--hair)}" +
  ".f span{padding:2.5mm 4mm}" +
  ".f span:first-child{color:var(--muted);border-right:1px solid var(--hair)}" +
  ".f span:last-child{font-weight:600;font-variant-numeric:tabular-nums;" +
  "white-space:pre-wrap;overflow-wrap:anywhere}" +
  ".f small{margin-left:2.5mm;color:var(--muted);font-size:13px;font-weight:500}"

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  )

/**
 * Etiket | değer satırı (`BOX_CSS`). `value` kaçırılmış olmalı; boşsa soluk tire.
 * `key` → `data-f`: sohbetteki izin formunda tyro'nun doldurduğu hücreler (`leaveFormFill.js`).
 */
export function field(label, value = "", { unit = "", key = "" } = {}) {
  const f = key ? ` data-f="${key}"` : ""
  const cell = value
    ? `<span${f}>${value}${unit ? `<small>${unit}</small>` : ""}</span>`
    : `<span class="empty"${f}>—</span>`
  return `<div class="f"><span>${label}</span>${cell}</div>`
}

export function stat(label, value, unit = "") {
  const big = value && unit ? `${value}<small>${unit}</small>` : value || "—"
  return `<div><span class="k">${label}</span><span class="big">${big}</span></div>`
}

export function page({ title, heading, sub, pill, aside = "", body, css }) {
  const pillHtml = pill ? `<span class="pill">${pill}</span>` : ""
  return (
    '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>${title}</title><style>${THEME_CSS}${css}</style></head><body>` +
    '<button class="print" type="button" onclick="window.print()">Yazdır</button>' +
    '<main class="sheet">' +
    `<header class="hd"><div><div class="ttl"><h1>${heading}</h1>${pillHtml}</div><p class="sub">${sub}</p></div>${aside}</header>` +
    body +
    "</main></body></html>"
  )
}

/** ERP biçimi: `5.10.2025` (gün sıfırsız, ay sıfırlı). */
export function formDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ""
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

/** 4 → "4,00"; 16416 → "16.416,00" (ERP iki ondalık, binlik nokta). */
export function formAmount(n) {
  if (n == null || !Number.isFinite(Number(n))) return ""
  return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
