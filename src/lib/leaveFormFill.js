/**
 * Sohbetteki izin formunu (HR MCP) tyro'nun bildikleriyle tamamlar — saf, testli.
 *
 * HR MCP formu ERP'den basar; Şirketi · Bölümü · Pozisyon ise Self Servis profil başlığında ne
 * yazıyorsa o olmalı (Graph birincil, istek üzerine). HR MCP'nin ERP değeri yedek olarak kalır.
 *
 * Hücreler `data-f="<anahtar>"` ile işaretli (`leaveFormSheet.js` ve HR MCP aynı biçimi basar).
 * Boş değer hücreye yazılmaz: bilmediğimiz yerde ERP'nin değeri kalır.
 */

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c],
  )

const cellRe = (key) =>
  new RegExp(
    `<span(?: class="empty")? data-f="${key}"([^>]*)>(?:[^<]|<small>[^<]*</small>)*</span>`,
  )

function setCell(html, key, value) {
  const text = String(value ?? "").trim()
  if (!text) return html
  return html.replace(
    cellRe(key),
    (_, attrs) => `<span data-f="${key}"${attrs}>${esc(text)}</span>`,
  )
}

const UNESC = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'" }

/** Hücrenin düz metni (ana değer, `<small>` notu hariç); boş hücrede "". */
export function leaveFormValue(html, key) {
  const m = String(html).match(cellRe(key))
  if (!m || m[0].startsWith('<span class="empty"')) return ""
  return m[0]
    .replace(/^<span[^>]*>/, "")
    .replace(/<\/span>$/, "")
    .replace(/<small>[^<]*<\/small>/g, "")
    .replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_, e) => UNESC[e])
    .trim()
}

/** Formun kişisi (Graph araması için): `<main … data-upn="…">`. */
export function leaveFormUpn(html) {
  return String(html).match(/<main[^>]*\sdata-upn="([^"]+)"/)?.[1] ?? ""
}

export function isFillableLeaveForm(html) {
  return typeof html === "string" && html.includes('data-f="company"')
}

/**
 * @param {string} html
 * @param {{ company?: string, department?: string, position?: string }} values
 */
export function fillLeaveForm(html, values = {}) {
  if (!isFillableLeaveForm(html)) return html
  let out = html
  for (const key of ["company", "department", "position"]) out = setCell(out, key, values[key])
  return out
}
