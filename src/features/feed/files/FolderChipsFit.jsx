import { useLayoutEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import { useLocale } from "@/hooks/useLocale"
import { fitCount } from "@/features/feed/lib/chipFit"
import { pluralKey } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { CHIP } from "./chipStyle"
import { FolderChip } from "./FilesTiles"
import { MoreFolders } from "./MoreFolders"

const GAP = 6 // gap-1.5

/**
 * Panonun "sık kullandığın klasörler" satırı — TEK SATIR, sarmaz (ürün sahibinin isteği): sığmayan
 * çipler "+N" çipinde toplanır, basınca listesi açılır. Kaç çipin sığdığını görünmez bir ölçü
 * katmanı söyler (aynı çipler, aynı kapsayıcı sorgusu); satır genişliği değişince yeniden ölçülür.
 */
export function FolderChipsFit({
  folders,
  onPick,
  pendingKey,
  labelFor,
  nameFor,
  ariaFor,
  lead,
  title,
}) {
  const { t, locale } = useLocale()
  const rowRef = useRef(null)
  const measureRef = useRef(null)
  const [shown, setShown] = useState(folders.length)

  useLayoutEffect(() => {
    const row = rowRef.current
    const box = measureRef.current
    if (!row || !box) return undefined
    const fit = () => {
      const chips = [...box.querySelectorAll("[data-fit-chip]")]
      const more = box.querySelector("[data-fit-more]")
      const ends = chips.map((el) => el.offsetLeft + el.getBoundingClientRect().width)
      setShown(fitCount(ends, row.getBoundingClientRect().width, more.offsetWidth, GAP))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(row)
    document.fonts?.ready.then(fit).catch(() => {})
    return () => ro.disconnect()
  }, [folders, lead, locale])

  const chipProps = (f) => ({
    folder: f,
    onPick,
    pending: pendingKey === f.url,
    root: labelFor(f),
    name: nameFor(f),
    aria: ariaFor?.(f),
  })
  const visible = folders.slice(0, shown)
  const hidden = folders.slice(shown)
  const leadEl = lead && (
    <span className="mr-1 shrink-0 text-[0.8125rem] font-medium text-muted-foreground">{lead}</span>
  )

  return (
    <div ref={rowRef} className="relative flex min-w-0 items-center gap-1.5 overflow-x-clip">
      {leadEl}
      {visible.map((f, i) => (
        <FolderChip
          key={f.url}
          {...chipProps(f)}
          className={cn(i === visible.length - 1 && "min-w-0 shrink")}
        />
      ))}
      {hidden.length > 0 && (
        <MoreFolders
          folders={hidden}
          onPick={onPick}
          pending={hidden.some((f) => f.url === pendingKey)}
          label={t(pluralKey("myfiles.home.moreFolders", locale, hidden.length), {
            n: hidden.length,
          })}
          title={title ?? lead}
          chipProps={chipProps}
        />
      )}
      {/* Ölçü katmanı: görünmez, odak almaz; çiplerin gerçek genişliği buradan okunur. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        inert
        className="pointer-events-none invisible absolute start-0 top-0 flex w-max items-center gap-1.5"
      >
        {leadEl}
        {folders.map((f) => (
          <span key={f.url} data-fit-chip className="inline-flex">
            <FolderChip {...chipProps(f)} />
          </span>
        ))}
        <span data-fit-more className={CHIP}>
          <HugeiconsIcon icon={Loading03Icon} className="size-3.5" />+{folders.length - 1}
        </span>
      </div>
    </div>
  )
}
