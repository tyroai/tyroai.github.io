/**
 * Xurrent ekip adları → kişi kartındaki gruplar (Ticket sayfası, `TibotTeams`). Ad iki dilli
 * ("Kurumsal Sistemler-AI / Enterprise Systems_AI"): Türkçe kısmı gösterilir, tamamı ipucunda.
 * Aynı öneki paylaşan ekipler tek grupta ("Kurumsal Sistemler" · GNL · SCM · AI); tek kalan kendi
 * adıyla. Sıra ilk görünüşe göre.
 */
export interface TeamGroup {
  label: string
  parts: string[]
  names: string[]
}

/** "Kurumsal Sistemler-AI / Enterprise Systems_AI" → "Kurumsal Sistemler-AI". */
export const shortTeamName = (name: string): string => name.split(" / ")[0].trim() || name

export function groupTeams(names: readonly string[]): TeamGroup[] {
  const groups = new Map<string, TeamGroup & { short: string }>()
  for (const name of names) {
    const short = shortTeamName(name)
    const m = /^(.*\S)-(\S{1,12})$/.exec(short)
    const key = m ? m[1] : short
    const g = groups.get(key) ?? { label: key, parts: [], names: [], short }
    if (m) g.parts.push(m[2])
    g.names.push(name)
    groups.set(key, g)
  }
  return [...groups.values()].map((g) =>
    g.names.length > 1
      ? { label: g.label, parts: g.parts, names: g.names }
      : { label: g.short, parts: [], names: g.names },
  )
}
