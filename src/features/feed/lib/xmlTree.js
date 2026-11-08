/**
 * Küçük XML ayrıştırıcı — DOM'suz, tarayıcıda ve Node'da aynı (birim testleri DOM'a ihtiyaç
 * duymaz). Office dosyalarının makine üretimi, düzenli XML'i için: düğüm `{ name, attrs, kids }`;
 * `name` ad alanı öneksiz ("w:p" → "p"), `attrs` hem önekli hem öneksiz adla okunur ("w:val" ve
 * "val"), `kids` düğüm ya da metin (string). Yorum, işlem yönergesi ve DOCTYPE atlanır, CDATA
 * metindir, varlıklar çözülür. Bozuk XML'de hata atmaz: elindekini döndürür.
 */
const ENTITY = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }

export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ""
    }
    return ENTITY[e.toLowerCase()] ?? m
  })
}

const local = (name) => name.slice(name.indexOf(":") + 1)
const TOKEN =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g
const ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

function attrsOf(source) {
  const attrs = {}
  for (const m of source.matchAll(ATTR)) {
    const value = decodeEntities(m[2] ?? m[3] ?? "")
    attrs[m[1]] = value
    const short = local(m[1])
    if (!(short in attrs)) attrs[short] = value
  }
  return attrs
}

export function parseXml(xml) {
  const root = { name: "#root", attrs: {}, kids: [] }
  const stack = [root]
  for (const m of String(xml ?? "").matchAll(TOKEN)) {
    const top = stack[stack.length - 1]
    if (m[1] !== undefined) top.kids.push(m[1])
    else if (m[3] !== undefined) {
      if (m[2]) {
        if (stack.length > 1) stack.pop()
        continue
      }
      const node = { name: local(m[3]), attrs: attrsOf(m[4] ?? ""), kids: [] }
      top.kids.push(node)
      if (!m[5]) stack.push(node)
    } else if (m[6] !== undefined) top.kids.push(decodeEntities(m[6]))
  }
  return root.kids.find((k) => typeof k !== "string") ?? root
}

const isNode = (k) => typeof k !== "string"

/** Doğrudan çocuk düğümler (ada göre; ad verilmezse hepsi). */
export const children = (node, name) =>
  node.kids.filter((k) => isNode(k) && (name === undefined || k.name === name))

/** İlk doğrudan çocuk düğüm ya da null. */
export const child = (node, name) => children(node, name)[0] ?? null

/** Soyundan, belge sırasıyla, verilen adlı bütün düğümler (`skip`: içine girilmeyen adlar). */
export function descendants(node, name, skip = []) {
  const out = []
  const walk = (n) => {
    for (const k of n.kids) {
      if (!isNode(k) || skip.includes(k.name)) continue
      if (k.name === name) out.push(k)
      walk(k)
    }
  }
  walk(node)
  return out
}

/** Düğümün altındaki bütün metin (düğümler arası boşluk eklenmez). */
export function textOf(node) {
  let out = ""
  for (const k of node.kids) out += isNode(k) ? textOf(k) : k
  return out
}
