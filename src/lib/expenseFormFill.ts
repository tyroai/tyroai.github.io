/**
 * Sohbetteki masraf formunu (HR MCP `get_expense_form`) Self Servis'in kişi bilgileriyle
 * tamamlar — saf, testli.
 *
 * HR MCP formu ERP'den basar (bölüm = masraf merkezinin adı, yönetici = ERP pozisyon
 * hiyerarşisi). Self Servis'in masraf formu ise kişiyi Graph profilinden, yöneticiyi Entra'dan
 * alır; iki ekran aynı kişiyi ve aynı yöneticiyi basmalı. Hücreler `data-f="emp-…"` /
 * `data-f="mgr-…"` ile işaretli (`expenseFormSheet.js` ve HR MCP `services/expense_form.py`
 * aynı biçimi basar; anahtarlar SÖZLEŞME).
 *
 * Kural: kişinin boş Graph değeri ERP'ninkini ezmez (aynı kişi). Yönetici ise Graph'ta başka
 * biri olabilir: o zaman ERP yöneticisinin değerleri onun yanında kalmasın diye bilinmeyen alan
 * "—" olur. Graph yönetici yok diyorsa (Self Servis'te kutu çizilmez) yönetici kutusu kalkar.
 * ERP'de yönetici yoksa HR MCP kutuyu hiç basmaz; Graph'ta yönetici varsa kutu Self Servis'teki
 * gibi eklenir (çalışan kutusunun aynı biçimi, başlığı "Bağlı Olduğu Kişi").
 */

export interface FormPerson {
  name?: string | null
  personnel?: string | null
  department?: string | null
  position?: string | null
}

export interface ExpenseFill {
  employee?: FormPerson | null
  /** Graph'ın yöneticisi; `null` = sorulamadı (ERP'ninki kalır). */
  manager?: FormPerson | null
  /** Graph kesin olarak "yönetici yok" dedi. */
  noManager?: boolean
}

const KEYS = ["name", "personnel", "department", "position"] as const
const DASH = "—"

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
}
const UNESC: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#x27": "'",
  "#39": "'",
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ESC[c] ?? c)
const text = (v: unknown) => String(v ?? "").trim()

const cellRe = (key: string) =>
  new RegExp(`<span(?: class="empty")? data-f="${key}"([^>]*)>([^<]*)</span>`)

function setCell(html: string, key: string, value: string): string {
  return html.replace(
    cellRe(key),
    (_m, attrs: string) => `<span data-f="${key}"${attrs}>${esc(value)}</span>`,
  )
}

/** Hücrenin düz metni; yoksa ya da "—" ise "". */
export function expenseFormValue(html: string, key: string): string {
  const raw = String(html).match(cellRe(key))?.[2] ?? ""
  const value = raw
    .replace(/&(amp|lt|gt|quot|#x27|#39);/g, (_m, e: string) => UNESC[e] ?? _m)
    .trim()
  return value === DASH ? "" : value
}

export function isFillableExpenseForm(html: unknown): html is string {
  return typeof html === "string" && html.includes('data-f="emp-name"')
}

/** Formun kişisi (Graph araması için): `<main … data-upn="…">`. */
export function expenseFormUpn(html: string): string {
  return String(html).match(/<main[^>]*\sdata-upn="([^"]+)"/)?.[1] ?? ""
}

/** Ad karşılaştırması: büyük/küçük harf, Türkçe harf ve aksan farkı yok sayılır. */
const fold = (v: string) =>
  v
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()

// Yönetici kutusu: içinde `mgr-name` hücresi olan bölüm (bölümler iç içe değil).
const BOX_RE = /<section class="box"><h2>[^<]*<\/h2>(?:(?!<\/section>)[\s\S])*<\/section>/g

function dropManagerBox(html: string): string {
  return html.replace(BOX_RE, (box) => (box.includes('data-f="mgr-name"') ? "" : box))
}

// `expenseFormSheet.js` › `renderExpenseForm`: yönetici kutusunun başlığı.
const MANAGER_HEADING = "Bağlı Olduğu Kişi"

/**
 * Yönetici kutusu yoksa çalışan kutusundan türetir: aynı satırlar, `emp-` → `mgr-`, değerler "—"
 * (sonra doldurulur). `expenseFormSheet.js` › `personBox`ın bastığıyla birebir aynı biçim.
 */
function addManagerBox(html: string): string {
  if (html.includes('data-f="mgr-name"')) return html
  let added = false
  const out = html.replace(BOX_RE, (box) => {
    if (added || !box.includes('data-f="emp-name"')) return box
    added = true
    const mgr = box
      .replace(/<h2>[^<]*<\/h2>/, `<h2>${MANAGER_HEADING}</h2>`)
      .replace(/data-f="emp-/g, 'data-f="mgr-')
      .replace(
        /<span(?: class="empty")? data-f="(mgr-[a-z]+)"[^>]*>[^<]*<\/span>/g,
        (_m, key: string) => `<span data-f="${key}">${DASH}</span>`,
      )
    return box + mgr
  })
  return added ? out : html
}

export function fillExpenseForm(html: string, fill: ExpenseFill = {}): string {
  if (!isFillableExpenseForm(html)) return html
  let out = html
  const employee = fill.employee ?? {}
  for (const key of KEYS) {
    const value = text(employee[key])
    if (value) out = setCell(out, `emp-${key}`, value)
  }
  if (fill.noManager) return dropManagerBox(out)
  const manager = fill.manager
  if (!manager || !text(manager.name)) return out
  out = addManagerBox(out)
  if (!out.includes('data-f="mgr-name"')) return out
  const same = fold(expenseFormValue(out, "mgr-name")) === fold(text(manager.name))
  for (const key of KEYS) {
    const value = text(manager[key])
    if (value) out = setCell(out, `mgr-${key}`, value)
    else if (!same) out = setCell(out, `mgr-${key}`, DASH)
  }
  return out
}

/** Graph kullanıcısı (`displayName, jobTitle, department, employeeId`) → form kişisi. */
export function formPersonFromGraph(user: unknown): FormPerson | null {
  if (!user || typeof user !== "object") return null
  const u = user as Record<string, unknown>
  const person = {
    name: text(u.displayName),
    personnel: text(u.employeeId),
    department: text(u.department),
    position: text(u.jobTitle),
  }
  return person.name ? person : null
}
