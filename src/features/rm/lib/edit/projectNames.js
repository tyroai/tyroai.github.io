// Proje adlarını sadeleştirme (sahibin kararı): alt çizgi ve eğik çizgi yok, "Uygulama Projesi"
// gibi ekler yok; ad üç-dört kelimelik kısa bir ad olur ("TYRO Perakende D365").

const SUFFIX = /\s+(?:uygulama(?:s[ıi])?\s+)?(?:projesi|proje|project)$/iu
const lower = (s) => String(s || "").toLocaleLowerCase("tr-TR")

/** Önerilen sade ad; tek kelime kalıp proje koduyla aynıysa (B2B) asıl ad kalır. */
export function cleanProjectName(name, code = "") {
  const raw = String(name || "").trim()
  const s = raw
    .replace(/_+/g, " ")
    .replace(/\s*[/\\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(SUFFIX, "")
    .replace(/[\s\-–—:,.;]+$/u, "")
    .trim()
  if (!s) return raw
  if (!s.includes(" ") && lower(s) === lower(code)) return raw
  return s
}

/** Sadeleşecek projeler: { pid, code, old, nv } (öneri asıl addan farklıysa). */
export function projectNamePairs(S) {
  return S.projects
    .map((p) => ({ pid: p.id, code: p.code, old: p.name, nv: cleanProjectName(p.name, p.code) }))
    .filter((x) => x.nv && x.nv !== String(x.old || "").trim())
}

/** Adları yazar ({ pid, nv }[]); boş ad yazılmaz. */
export function renameProjects(S, pairs) {
  for (const { pid, nv } of pairs) {
    const p = S.projects.find((x) => x.id === pid)
    const n = String(nv || "").trim()
    if (p && n) p.name = n
  }
}
