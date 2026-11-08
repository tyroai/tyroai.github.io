import { useRef, useState } from "react"
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import { WidgetFrame } from "../WidgetFrame"
import { Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { useNarrow } from "../useNarrow"
import { ConverterView } from "./ConverterView"
import { CotView } from "./CotView"
import { useCot } from "./useCot"

// İçerik < 26rem: COT tek sütun (Piyasa kartının eşiği); < 16rem: çevirici sıkı düzende.
const NARROW_PX = 416
const COMPACT_PX = 256

/**
 * Trader masası — iki görünüm: **Çevirici** (bushel ↔ ton, ¢/bu → $/t, $/t → ₺/t; saf hesap) ve
 * **COT** (CFTC fon pozisyonları, haftalık; `features/widgets/lib/cot`). COT yalnız o görünüm açılınca okunur.
 */
export function TraderWidget({ className }) {
  const { t } = useLocale()
  const [view, setView] = useState("convert")
  const cot = useCot(view === "cot")
  const body = useRef(null)
  const narrow = useNarrow(body, NARROW_PX)
  const compact = useNarrow(body, COMPACT_PX)
  // Görünüm seçici bir satır aldı: kartın sabit boyunda sayfada iki satır (geniş kartta iki sütun).
  const pager = usePager(cot.data?.markets ?? [], narrow ? 2 : 4)
  return (
    <WidgetFrame
      id="trader"
      title={t("widgets.trader.title")}
      icon={Exchange01Icon}
      busy={view === "cot" && cot.loading}
      className={className}
      pager={
        view === "cot" && narrow ? <Pager pager={pager} label={t("widgets.trader.title")} /> : null
      }
    >
      <div ref={body} className="flex min-h-0 flex-1 flex-col">
        <SegmentedControl
          fill
          label={t("widgets.trader.viewLabel")}
          value={view}
          onChange={setView}
          options={[
            { value: "convert", label: t("widgets.trader.tab.convert") },
            { value: "cot", label: t("widgets.trader.tab.cot") },
          ]}
          itemClassName="h-7 px-2.5 text-[0.75rem]"
          className="mt-1"
        />
        {view === "convert" ? (
          <ConverterView compact={compact} />
        ) : (
          <CotView cot={cot} pager={pager} />
        )}
      </div>
    </WidgetFrame>
  )
}
