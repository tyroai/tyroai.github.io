import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { cn } from "@/lib/utils"
import { NUM_CHIP } from "./summaryUi"

// Numara çiplerinin en çoğu; fazlası "+n".
const CHIPS = 8

/** Kalem numaraları düğme olarak (ileri tarihli, mükerrer olabilecek kalemler); fazlası "+n". */
export function LineChips({ list, label, onPick }) {
  const extra = list.length - CHIPS
  return (
    <>
      {list.slice(0, CHIPS).map((r) => (
        <button
          key={r.rowId}
          type="button"
          onClick={() => onPick(r.rowId)}
          aria-label={label(r.n)}
          className={NUM_CHIP}
        >
          {r.n}
        </button>
      ))}
      {extra > 0 && <span className="tabular-nums">+{extra}</span>}
    </>
  )
}

/**
 * Ayrıntı parçaları "a · b · c": parça bölünmez, satır parça aralarında kırılır; satır başına
 * düşen ayraç kabın dışında kalır (kırpılır), dar panelde satır "·" ile başlamaz ya da bitmez.
 */
function Parts({ list }) {
  return (
    <span className="block overflow-hidden">
      <span className="-ms-3 flex flex-wrap">
        {list.map((part, i) => (
          <span key={i} className="whitespace-nowrap">
            <span aria-hidden="true" className="inline-block w-3 text-center">
              ·
            </span>
            {part}
          </span>
        ))}
      </span>
    </span>
  )
}

// Durum tonları (paletten bağımsız): uyarı sarı, tamam yeşil. İkon küçük tonlu yuvarlakta.
const TONE = {
  warning: { dot: "bg-warning/16 text-warning-ink", text: "text-warning-ink" },
  success: { dot: "bg-success/14 text-success-ink", text: "text-foreground" },
}

/**
 * Özetin durum satırı: tonlu yuvarlakta ikon, kısa metin (uzun açıklama ⓘ `tip`'te), satırın
 * sonunda isteğe bağlı tek eylem (`end`); altında gerekirse ayrıntı (`detail`: sakin yazı,
 * parçalar dizisi) ve eylemler. `tone`: "warning" (engellemez: ileri tarih, olası mükerrer, fiş
 * yok) ya da "success" (fiş eklendi).
 */
export function Note({
  tone = "warning",
  icon = Alert02Icon,
  tip,
  end,
  children,
  detail,
  actions,
}) {
  const look = TONE[tone]
  return (
    <div className="flex items-start gap-2.5 text-[0.8125rem] leading-snug">
      <span
        aria-hidden="true"
        className={cn("grid size-5 shrink-0 place-items-center rounded-full", look.dot)}
      >
        <HugeiconsIcon icon={icon} className="size-3" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className={cn("min-w-0 font-medium text-pretty", look.text)}>
            {children}
            {tip && <InfoTip text={tip} className="-my-0.5 ms-0.5 align-middle" />}
          </p>
          {end}
        </div>
        {detail?.length > 0 && (
          <div className="mt-0.5 text-[0.75rem] text-muted-foreground tabular-nums">
            <Parts list={detail} />
          </div>
        )}
        {actions && (
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-foreground">{actions}</p>
        )}
      </div>
    </div>
  )
}

/** Dikkat satırı (engellemez): uyarı tonunda `Note`. */
export const Warn = (props) => <Note tone="warning" {...props} />
