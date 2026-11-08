import { createContext, useContext } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import { useLocale } from "@/hooks/useLocale"
import { sameDay } from "@/lib/leaveDays"
import { cn } from "@/lib/utils"

const ReadMarks = createContext(null)

/** Fişten okunan değerler (kalem → alan → değer): kalemlerin hücreleri işaretlerini buradan okur. */
export function ReadMarksProvider({ marks, children }) {
  return <ReadMarks.Provider value={marks}>{children}</ReadMarks.Provider>
}

const same = (a, b) => (a instanceof Date || b instanceof Date ? sameDay(a, b) : a === b)

/**
 * Hücrenin "fişten okundu" işareti (sihirli değnek): değer hâlâ fişten okunan değerse görünür;
 * kişi değiştirince kendiliğinden söner.
 */
export function ReadMark({ rowId, field, value, className }) {
  const marks = useContext(ReadMarks)
  const { t } = useLocale()
  const read = marks?.[rowId]?.[field]
  if (read === undefined || !same(read, value)) return null
  const label = t("selfService.expense.read.mark")
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full bg-brand/[0.12] text-brand-ink",
        className,
      )}
    >
      <HugeiconsIcon
        icon={MagicWand01Icon}
        aria-hidden="true"
        className="size-2.5"
        strokeWidth={2}
      />
    </span>
  )
}
