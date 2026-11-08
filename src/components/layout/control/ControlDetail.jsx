import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CityPick } from "../headerWidgets/catalog/HeaderFaceSettings"
import {
  headerFaceOf,
  headerLookOf,
  setHeaderFace,
  useHeaderWidgets,
} from "../headerWidgets/headerStore"
import { WidgetPanel } from "../headerWidgets/trayParts"
import { isBuiltin } from "./controlModel"
import { FocusOptions } from "./FocusOptions"
import { OofDetail } from "./OofDetail"
import { PinMenu } from "./PinMenu"
import { PresenceDetail } from "./PresenceDetail"
import { ShortcutsDetail } from "./ShortcutsDetail"
import { TaskDetail } from "./tiles/TaskTile"
import { tileTitleKey } from "./tileTitle"

const BUILTIN_BODY = {
  "toggle:focus": FocusOptions,
  "tool:task": TaskDetail,
  "tool:presence": PresenceDetail,
  "tool:oof": OofDetail,
  "tool:shortcuts": ShortcutsDetail,
}

/**
 * Kutucuk panelin içinde büyür (macOS'ta modülün açılması gibi): üstte geri ve kalıcı yeri
 * (`PinMenu`); altında widget'ın kendisi — header'da açılan pencerenin aynısı, adı kartın
 * başlığında (iki kez yazılmaz) — ya da yerleşik aracın içi (başlıkla). Pencere ızgarayla aynı
 * enle kalır (genişleyip zıplamaz); Tyrofy'ın sahnesi kendi eninde ortada. Dünya saatinde
 * üst şeritte kutucukta görünecek şehir seçilir (header'la ortak). Açılınca odak geri düğmesinde.
 */
export function ControlDetail({ id, onBack }) {
  const { t } = useLocale()
  const { looks, faces } = useHeaderWidgets()
  const back = useRef(null)
  const title = t(tileTitleKey(id))
  const builtin = isBuiltin(id)
  const Body = BUILTIN_BODY[id]
  useEffect(() => {
    back.current?.focus({ preventScroll: true })
  }, [])
  return (
    <section aria-label={title}>
      <div className="cc-head">
        <button
          ref={back}
          type="button"
          className="cc-icon-btn"
          aria-label={t("control.panel.back")}
          title={t("control.panel.back")}
          onClick={onBack}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="size-[1.125rem] rtl:-scale-x-100"
          />
        </button>
        <h2 className={builtin ? "cc-head-title" : "sr-only"}>{title}</h2>
        {!builtin && (
          <span className="cc-head-mid">
            {id === "world-clock" && (
              <CityPick
                value={headerFaceOf(faces, id).city}
                onChange={(city) => setHeaderFace(id, { ...headerFaceOf(faces, id), city })}
              />
            )}
          </span>
        )}
        {!builtin && <PinMenu id={id} title={title} />}
      </div>
      {Body ? (
        <Body />
      ) : (
        <div className={cn("cc-detail-body", id === "radio" && "cc-detail-stage")}>
          <div className={cn("group/stack relative", id === "radio" ? "w-64" : "w-full")}>
            <WidgetPanel id={id} look={headerLookOf(looks, id)} />
          </div>
        </div>
      )}
    </section>
  )
}
