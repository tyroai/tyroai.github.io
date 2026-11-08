import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import ViewOffSlashIcon from "@hugeicons/core-free-icons/ViewOffSlashIcon"
import SidebarRightIcon from "@hugeicons/core-free-icons/SidebarRightIcon"
import TaskAdd01Icon from "@hugeicons/core-free-icons/TaskAdd01Icon"
import MailReply01Icon from "@hugeicons/core-free-icons/MailReply01Icon"
import UserStatusIcon from "@hugeicons/core-free-icons/UserStatusIcon"
import Link04Icon from "@hugeicons/core-free-icons/Link04Icon"
import { useLocale } from "@/hooks/useLocale"
import { HEADER_IDS, HEADER_SUGGESTED } from "../headerWidgets/headerStore"
import { TrayGlyph } from "../headerWidgets/faces/TrayGlyph"
import { addableTiles, isBuiltin, moveTile, withTile, withoutTile } from "./controlModel"
import { AppearanceGlyph } from "./ControlGlyph"
import { ControlGrid } from "./ControlGrid"
import { tileTitleKey } from "./tileTitle"
import { resetControlTiles, setControlLook, setControlTiles, useControlLook } from "./controlStore"

const BUILTIN_ICON = {
  "toggle:focus": Moon02Icon,
  "toggle:present": ViewOffSlashIcon,
  "toggle:notch": SidebarRightIcon,
  "tool:task": TaskAdd01Icon,
  "tool:presence": UserStatusIcon,
  "tool:oof": MailReply01Icon,
  "tool:shortcuts": Link04Icon,
}
// Ekleme listesinin sırası: header'ın önerdikleri önce, gerisi katalog sırasıyla.
const CANDIDATES = [...new Set([...HEADER_SUGGESTED, ...HEADER_IDS])]

/**
 * Denetimleri düzenle (macOS'taki gibi): kutucuklar önizleme, "−" ile çıkar, sürükleyerek ya da
 * ok tuşlarıyla sırası değişir (kısayollar hep sonda); altta eklenebilecek düğmeler ve widget'lar
 * (bu kişiye açık olanlar). Her değişiklik hemen kaydedilir ve ekran okuyucuya söylenir;
 * kaldırılan kutucuğun yerine odak sıradakine geçer, liste bitince "Bitti"ye.
 */
export function ControlEdit({ tiles, available, onDone }) {
  const { t } = useLocale()
  const look = useControlLook()
  const [said, setSaid] = useState("")
  const [focusAt, setFocusAt] = useState(null)
  const grid = useRef(null)
  const done = useRef(null)
  const addable = addableTiles(tiles, CANDIDATES, available)
  const name = (id) => t(tileTitleKey(id))

  useEffect(() => {
    if (focusAt == null) return
    const next = grid.current?.querySelectorAll(".cc-remove")[focusAt]
    ;(next ?? done.current)?.focus({ preventScroll: true })
  }, [focusAt, tiles])

  const remove = (id) => {
    const at = tiles.indexOf(id)
    setControlTiles(withoutTile(tiles, id))
    setSaid(t("control.panel.removed", { name: name(id) }))
    setFocusAt(Math.max(0, Math.min(at, tiles.length - 2)))
  }
  const move = (id, to) => {
    const next = moveTile(tiles, id, to)
    if (next !== tiles) setControlTiles(next)
  }
  const add = (id) => {
    setControlTiles(withTile(tiles, id))
    setSaid(t("control.panel.added", { name: name(id) }))
  }

  return (
    <>
      <span role="status" className="sr-only">
        {said}
      </span>
      <ControlGrid
        tiles={tiles}
        editing
        onRemove={remove}
        onMove={move}
        announce={(id, at) => setSaid(t("control.panel.moved", { name: name(id), n: at + 1 }))}
        gridRef={grid}
      />
      <div className="cc-list cc-look">
        <label className="cc-row cc-switch">
          <span className="cc-row-label">
            {t("control.glass.title")}
            <span className="cc-badge">{t("control.glass.beta")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={look === "glass"}
            onChange={(e) => {
              setControlLook(e.target.checked ? "glass" : null)
              // Yapışkan açılışın şekli kartın zeminini yeniden ölçsün (camda söner).
              requestAnimationFrame(() => window.dispatchEvent(new Event("resize")))
            }}
          />
        </label>
      </div>
      <p className="cc-section">{t("headerWidgets.addSection")}</p>
      {addable.length ? (
        <div className="cc-list">
          {addable.map((id) => (
            <button
              key={id}
              type="button"
              className="cc-row"
              aria-label={t("control.panel.addOne", { name: name(id) })}
              onClick={() => add(id)}
            >
              <span className="cc-ic">
                {id === "toggle:theme" ? (
                  <AppearanceGlyph />
                ) : isBuiltin(id) ? (
                  <HugeiconsIcon icon={BUILTIN_ICON[id]} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <TrayGlyph id={id} live={false} />
                )}
              </span>
              <span className="cc-row-label">{name(id)}</span>
              <span className="cc-add" aria-hidden="true">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="cc-note">{t("control.panel.empty")}</p>
      )}
      <div className="cc-foot" data-split="">
        <button type="button" className="cc-pill" data-tone="plain" onClick={resetControlTiles}>
          {t("control.panel.reset")}
        </button>
        <button ref={done} type="button" className="cc-pill" data-tone="prominent" onClick={onDone}>
          {t("control.panel.done")}
        </button>
      </div>
    </>
  )
}
