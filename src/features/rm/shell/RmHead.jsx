import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { PageHeading } from "@/components/common/SectionHeading"
import { stamp } from "@/features/rm/lib/format"
import { useRmText } from "../data/useRmText"
import { InsightChips } from "../common/InsightChips"
import { useRm } from "./RmContext"

/** Verinin damgası: "bu rakam ne zamanın?" sorusu kalkar. Okuyana "Salt okunur" da yazar. */
export function DataStamp({ className }) {
  const { rt, locale } = useRmText()
  const { edit, data } = useRm()
  const m = data.meta
  if (!m?.modifiedOn) return null
  return (
    <span
      className={
        "inline-flex h-8 items-center gap-1.5 rounded-full bg-muted/60 px-3 text-xs text-muted-foreground tabular-nums dark:bg-white/[0.05] " +
        (className || "")
      }
    >
      <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={1.8} />
      {rt(edit ? "rm.stamp.edit" : "rm.stamp.view", {
        time: stamp(m.modifiedOn, locale),
        who: m.modifiedBy || "—",
      })}
    </span>
  )
}

/**
 * Sayfa başı: üst etiket, başlık, altında sayfanın cevabı (tonlu göstergeler `insights` ya da tek
 * cümle `answer`); sağda damga ve tek birincil eylem. `stamp={false}`: veri damgası yok.
 */
export function RmHead({ group, title, answer, insights, actions, stamp = true }) {
  const { rt } = useRmText()
  const { phone } = useRm()
  const head = (
    <PageHeading
      eyebrow={
        // Üst etiket büyük harfle yazılır; marka adı kendi yazımıyla kalır.
        <>
          <span className="normal-case tracking-normal">tyroRM</span>
          {group ? <span className="whitespace-nowrap">· {group}</span> : null}
        </>
      }
      title={title}
      description={answer ? <span dir="auto">{answer}</span> : null}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {stamp && !phone && <DataStamp />}
          {actions}
        </div>
      }
    />
  )
  if (!insights?.length) return head
  // Göstergeler başlığın altında tam genişlik: eylemlerle aynı sütuna sıkışıp bölünmesin.
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {head}
      <InsightChips items={insights} label={rt("rm.ins.label")} scroll={phone} />
    </div>
  )
}
