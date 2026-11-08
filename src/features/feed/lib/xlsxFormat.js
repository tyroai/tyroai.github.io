/**
 * Excel hücre biçimi (saf): sayı biçimi kodundan hücrenin GÖRÜNÜŞÜ ve tarih seri numarası. Ek
 * önizlemesi (`features/feed/lib/xlsxRead`) hücreleri Excel'deki gibi göstermeye çalışır: "#,##0.00" ayraçlı
 * iki ondalık, "0%" yüzde, tarih biçimleri tarih. Karmaşık biçimler (koşullar, kesirler, bilimsel
 * gösterim) sadeleşir — hızlı önizlemenin sınırı; tam görünüm için dosya indirilir.
 */
const BUILTIN = {
  0: "General",
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  5: '"$"#,##0',
  6: '"$"#,##0',
  7: '"$"#,##0.00',
  8: '"$"#,##0.00',
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  14: "d/m/yyyy",
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  22: "d/m/yyyy h:mm",
  37: "#,##0",
  38: "#,##0",
  39: "#,##0.00",
  40: "#,##0.00",
  41: "#,##0",
  42: '"$"#,##0',
  43: "#,##0.00",
  44: '"$"#,##0.00',
  45: "mm:ss",
  46: "[h]:mm:ss",
  47: "mm:ss.0",
  49: "@",
}

/** Biçim kodunun ilk bölümü (`;` ile ayrılanların ilki; tırnak içindeki `;` sayılmaz). */
function firstSection(code) {
  let quoted = false
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '"') quoted = !quoted
    else if (code[i] === ";" && !quoted) return code.slice(0, i)
  }
  return code
}

/**
 * Biçim kodunun anlamı: `{ kind: "general" | "text" | "number" | "date", decimals, group,
 * percent, prefix, suffix, date, time, seconds, monthName }`. `id`: yerleşik biçim numarası;
 * `custom`: dosyanın kendi biçim kodu (varsa yerleşiğin yerine geçer).
 */
export function describeFormat(id, custom) {
  const code = custom ?? BUILTIN[id] ?? "General"
  if (/^general$/i.test(code.trim())) return { kind: "general" }
  const section = firstSection(code)
  let prefix = ""
  let suffix = ""
  let digits = false
  let bare = ""
  const literal = (text) => {
    if (digits) suffix += text
    else prefix += text
  }
  // Tırnaklı yazı, kaçışlı karakter ve [..] etiketleri ayrıştırılır; kalanı biçimin iskeletidir.
  for (let i = 0; i < section.length; i++) {
    const c = section[i]
    if (c === '"') {
      const end = section.indexOf('"', i + 1)
      literal(section.slice(i + 1, end < 0 ? undefined : end))
      i = end < 0 ? section.length : end
    } else if (c === "[") {
      const end = section.indexOf("]", i)
      const tag = section.slice(i + 1, end < 0 ? undefined : end)
      i = end < 0 ? section.length : end
      const money = /^\$([^-\]]*)/.exec(tag)?.[1]
      if (money) literal(money)
      else if (/^[hms]+$/i.test(tag)) bare += tag.toLowerCase() // [h]:mm → süre
    } else if (c === "\\") {
      const next = section[i + 1] ?? ""
      i += 1
      if (next === " " || /[$€£₺¥]/.test(next)) literal(next)
    } else if (c === "_" || c === "*") {
      i += 1 // boşluk ve dolgu karakteri
    } else if (c === " " || /[$€£₺¥]/.test(c)) {
      literal(c)
    } else {
      bare += c
      if (/[0#?]/.test(c)) digits = true
    }
  }
  const plain = bare.replace(/AM\/PM|A\/P/gi, "")
  if (plain.trim() === "@") return { kind: "text" }
  const date = /[dy]/i.test(plain) || /mmm/i.test(plain)
  const time =
    /h/i.test(plain) || /ss?/i.test(plain.replace(/[#0?.,%E+-]/g, "")) || /AM\/PM/i.test(bare)
  if (date || time) {
    return {
      kind: "date",
      date,
      time,
      seconds: /s/i.test(plain),
      monthName: /mmm/i.test(plain),
    }
  }
  const decimals = (/\.([0#?]+)/.exec(plain)?.[1] ?? "").length
  return {
    kind: "number",
    decimals,
    group: /[0#?],[0#?]/.test(plain),
    percent: plain.includes("%"),
    prefix,
    suffix,
  }
}

/** Excel seri numarası → UTC `Date` (1900 sistemi; `date1904` işaretli çalışma kitabında 1904). */
export function serialToDate(serial, date1904 = false) {
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30)
  return new Date(base + Math.round(serial * 86400000))
}

/** Ayraçlı/ayraçsız sayı: ondalık sayısı biçimin dediği; General'de en çok 10 anlamlı basamak. */
function number(value, desc, locale) {
  if (desc.kind === "general") {
    return new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumSignificantDigits: 10,
    }).format(value)
  }
  const shown = desc.percent ? value * 100 : value
  const body = new Intl.NumberFormat(locale, {
    useGrouping: desc.group,
    minimumFractionDigits: desc.decimals,
    maximumFractionDigits: desc.decimals,
  }).format(shown)
  return `${desc.prefix}${body}${desc.percent ? "%" : ""}${desc.suffix}`
}

/** Hücre değeri → görünür metin (`desc`: `describeFormat`). Okunamayan sayı olduğu gibi döner. */
export function formatValue(raw, desc, { locale = "tr", date1904 = false } = {}) {
  const value = Number(raw)
  if (raw === "" || raw == null || !Number.isFinite(value)) return String(raw ?? "")
  if (desc.kind === "text") return String(raw)
  if (desc.kind !== "date") return number(value, desc, locale)
  const when = serialToDate(value, date1904)
  if (Number.isNaN(when.getTime())) return String(raw)
  const opts = { timeZone: "UTC" }
  if (desc.date) {
    Object.assign(opts, { day: "numeric", month: desc.monthName ? "short" : "numeric" })
    opts.year = "numeric"
  }
  if (desc.time) {
    Object.assign(opts, { hour: "2-digit", minute: "2-digit" })
    if (desc.seconds) opts.second = "2-digit"
  }
  return new Intl.DateTimeFormat(locale, opts).format(when)
}
