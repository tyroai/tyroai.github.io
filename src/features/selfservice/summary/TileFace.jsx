import { motion, useReducedMotion } from "motion/react"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { useLocale } from "@/hooks/useLocale"

/** İzin bakiyesinin ince çizgisi: kullanılan / hak; ilk çizimde dolarak gelir. */
function UsedLine({ share }) {
  const reduce = useReducedMotion()
  return (
    <span
      aria-hidden="true"
      className="ss-tile-line mt-2.5 block h-1 w-full max-w-[9rem] overflow-hidden rounded-full bg-foreground/[0.08]"
    >
      <motion.span
        initial={reduce ? false : { scaleX: 0 }}
        animate={{ scaleX: share }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="block h-full origin-left rounded-full bg-brand rtl:origin-right"
      />
    </span>
  )
}

/**
 * Kutunun yüzü — sade stat: küçük büyük harfli ad, büyük değer, tek soluk alt satır (izinde
 * varsa sonraki hak ediş, yoksa hak/kullanılan; parada sayılar ve "toplam dışı"). Yalnız metin
 * ve şekil (span'ler: düğmenin içinde de geçerli). `counter` verilirse değer sayaçla döner
 * (dönem değişince); `value` sayacın düz metni ve yedeği. `progress`: izin bakiyesinin çizgisi.
 */
export function TileFace({
  title,
  short,
  value,
  full,
  counter,
  caption,
  note,
  hint,
  progress,
  loading,
}) {
  const { locale } = useLocale()
  return (
    <span className="block min-w-0">
      <span className="block truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-foreground/65">
        {/* Dar kapta kısa ad (yılsız): üç kutu tek satırda. */}
        <span className="ss-tile-short @[44rem]/ss:hidden">{short ?? title}</span>
        <span className="ss-tile-full hidden @[44rem]/ss:inline">{title}</span>
      </span>
      {loading ? (
        <span className="ms-skeleton mt-2 block h-7 w-24 rounded-md" />
      ) : (
        <span
          // Kısaltılmış tutarın ("₺12,3 Mn") tamamı fare ipucunda ve ekran okuyucuda.
          title={full}
          data-private=""
          className="ss-tile-value mt-1 block truncate text-[1.125rem] font-semibold leading-tight tabular-nums tracking-[-0.025em] text-foreground @[44rem]/ss:mt-1.5 @[44rem]/ss:text-[1.75rem]"
        >
          <span aria-hidden={full ? "true" : undefined}>
            {counter ? <AnimatedCounter {...counter} locale={locale} fallback={value} /> : value}
          </span>
          {full && <span className="sr-only">{full}</span>}
        </span>
      )}
      {progress != null && !loading && <UsedLine share={progress} />}
      {/* Tutarlar kırpılmaz (kutuda üç satıra kadar iner); tamamı fare ipucunda ve ayrıntı kartında. */}
      <span
        title={[note, caption].filter(Boolean).join(" · ")}
        className="mt-1.5 hidden text-[0.75rem] text-foreground/65 @[44rem]/ss:block"
      >
        {/* İç kap: `line-clamp` `display`i değiştirir, dıştaki `hidden`/`block` geçişini bozmasın. */}
        <span data-private="" className="ss-tile-note line-clamp-3 break-words">
          {note ?? caption}
        </span>
      </span>
      {note && caption && <span className="sr-only">{caption}</span>}
      {hint && <span className="sr-only">{hint}</span>}
    </span>
  )
}
