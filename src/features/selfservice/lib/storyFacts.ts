import { inYear } from "@/lib/selfServiceModel"
import { statusKind } from "@/lib/selfServiceStatus"

/**
 * "TYRO özeti"nin verisi (Kartlar düzeni): seçili dönemin kayıtlarından ilgi isteyenler sayılır.
 * Cümle model üretimi değil, bu sayılardan kurulur: ekranda yazan her sayı listede bulunur.
 */
interface RecordLike {
  date?: Date | null
  status?: string | null
  statusKind?: string | null
}
interface StoryData {
  leaves?: RecordLike[] | null
  expenses?: RecordLike[] | null
  advances?: RecordLike[] | null
}
export type StoryTab = "leave" | "expense" | "advance"
export interface StoryFacts {
  leaves: number
  pending: Record<StoryTab, number>
  returned: Record<StoryTab, number>
  drafts: number
}
export interface StoryLine {
  id: "drafts" | "pending" | "calm" | "balance" | "accrual" | "records"
  n?: number
}
/** Listeyi süzen tek eylem: hangi sekme, hangi durum. */
export interface StoryFocus {
  id: "drafts" | "pending"
  tab: StoryTab
  status: "draft" | "pending"
}

const TABS: [StoryTab, keyof StoryData][] = [
  ["leave", "leaves"],
  ["expense", "expenses"],
  ["advance", "advances"],
]
const kindOf = (r: RecordLike): string => r.statusKind ?? statusKind(r.status)
const sum = (o: Record<StoryTab, number>) => o.leave + o.expense + o.advance
const firstTab = (o: Record<StoryTab, number>): StoryTab =>
  TABS.map(([tab]) => tab).find((tab) => o[tab] > 0) ?? "leave"

export function storyFacts(data: StoryData | null | undefined, year: number | null): StoryFacts {
  const out: StoryFacts = {
    leaves: 0,
    pending: { leave: 0, expense: 0, advance: 0 },
    returned: { leave: 0, expense: 0, advance: 0 },
    drafts: 0,
  }
  for (const [tab, key] of TABS) {
    const list = inYear(data?.[key] ?? [], year) as RecordLike[]
    if (tab === "leave") out.leaves = list.length
    for (const r of list) {
      const kind = kindOf(r)
      if (kind === "pending") out.pending[tab] += 1
      else if (kind === "returned") out.returned[tab] += 1
      else if (kind === "draft" && tab === "expense") out.drafts += 1
    }
  }
  return out
}

/**
 * Özetin cümleleri, prototipteki anlatı sırasıyla: dönemin kayıtları ve onaydakiler, kalan izin
 * ve sonraki hak ediş, sonra gönderilmeyen masraf raporları. Bekleyen hiçbir şey yoksa sonda sakin
 * cümle. İade edilen kayıtlar için cümle ya da öneri YOK (ürün sahibi); sayılır ama yalnız sakin
 * cümleyi susturur ("bekleyen işin yok" yanlış olmasın). Her cümle gerçek bir sayıya dayanır.
 */
export function storyLines(
  facts: StoryFacts,
  { hasBalance = false, hasAccrual = false }: { hasBalance?: boolean; hasAccrual?: boolean } = {},
): StoryLine[] {
  const lines: StoryLine[] = []
  const returned = sum(facts.returned)
  const pending = sum(facts.pending)
  if (facts.leaves) lines.push({ id: "records", n: facts.leaves })
  if (pending) lines.push({ id: "pending", n: pending })
  if (hasBalance) lines.push({ id: "balance" })
  if (hasAccrual) lines.push({ id: "accrual" })
  if (facts.drafts) lines.push({ id: "drafts", n: facts.drafts })
  if (!returned && !pending && !facts.drafts) lines.push({ id: "calm" })
  return lines
}

/** En önemli bekleyen işin listesi; bekleyen yoksa null. İade edilenler için düğme önerilmez. */
export function storyFocus(facts: StoryFacts): StoryFocus | null {
  if (facts.drafts) return { id: "drafts", tab: "expense", status: "draft" }
  if (sum(facts.pending)) return { id: "pending", tab: firstTab(facts.pending), status: "pending" }
  return null
}
