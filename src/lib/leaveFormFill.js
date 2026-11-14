/**
 * Sohbetteki izin formunu (HR MCP) tyro'nun bildikleriyle tamamlar — saf, testli.
 *
 * HR MCP formu ERP'den basar; kişi bilgisi ise Self Servis profil başlığında ne yazıyorsa o
 * olmalı (Graph birincil, istek üzerine): Ad Soyad · Sicil No · İşe Giriş · Şirketi · Bölümü ·
 * Pozisyon. HR MCP'nin ERP değeri yedek olarak kalır. Ad formda dört yerde geçer (hücre, başlık
 * satırı, belge başlığı, imzanın altı) ve dördü birlikte değişir; sicil başlık satırındadır.
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

// Başlık satırı: "<ad> · Sicil No <sicil>" (`leaveFormSheet.js` ve HR MCP aynı biçimi basar).
const SUB_RE = /<p class="sub">([^<]*) · Sicil No ([^<]*)<\/p>/
const TITLE_RE = /<title>Personel İzin\/Görev Formu · [^<]*<\/title>/
// İmzanın altındaki ad. "Personel İmzası" satırının kendisi `signedForm.js` ile SÖZLEŞME: dokunulmaz.
const SIGN_NAME_RE = /(<span>Personel İmzası<\/span><\/div><p>)[^<]*(<\/p>)/

function setName(html, value) {
  const name = esc(String(value ?? "").trim())
  if (!name) return html
  return setCell(html, "name", value)
    .replace(SUB_RE, (_, _old, no) => `<p class="sub">${name} · Sicil No ${no}</p>`)
    .replace(TITLE_RE, () => `<title>Personel İzin/Görev Formu · ${name}</title>`)
    .replace(SIGN_NAME_RE, (_, open, close) => `${open}${name}${close}`)
}

function setPersonnel(html, value) {
  const no = esc(String(value ?? "").trim())
  if (!no) return html
  return html.replace(SUB_RE, (_, name) => `<p class="sub">${name} · Sicil No ${no}</p>`)
}

/**
 * @param {string} html
 * @param {{ name?: string, personnel?: string, hire?: string, company?: string,
 *   department?: string, position?: string }} values
 */
export function fillLeaveForm(html, values = {}) {
  if (!isFillableLeaveForm(html)) return html
  let out = setPersonnel(setName(html, values.name), values.personnel)
  for (const key of ["hire", "company", "department", "position"])
    out = setCell(out, key, values[key])
  return out
}
