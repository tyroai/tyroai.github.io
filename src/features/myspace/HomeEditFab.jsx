import { useCallback, useRef } from "react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import DashboardSquareEditIcon from "@hugeicons/core-free-icons/DashboardSquareEditIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { useToastAvoid } from "@/hooks/useToastAvoid"
import { useUrlCommand } from "@/hooks/useUrlCommand"
import { setBoardEditing, useBoardEditing } from "@/lib/boardEdit"
import "@/components/common/fab.css"
import "./HomeEditFab.css"

const SWAP = { type: "spring", stiffness: 420, damping: 28 }

/**
 * Anasayfa'yı düzenle — sayfanın sağ altında ortak yüzen düğme (`fab`, kitle `HOME_EDIT`):
 * düzenleme kipini açar/kapar (`lib/boardEdit`); düzenlerken palet halesi ve onay işareti.
 * Sayfayla kaymaz; çentik ekrandayken rayın solunda, toplantı geri sayımı varken onun üstünde
 * (`--float-stack-bottom`); bildirim yığını ona binmez. Esc ve "Bitti" odağı buraya döndürür
 * (`data-board-edit-toggle`). Yeri: `HomeEditFab.css`.
 */
export function HomeEditFab() {
  const { t } = useLocale()
  const editing = useBoardEditing()
  const ref = useRef(null)
  useToastAvoid(ref, "bottom")
  // `?edit=1`: başka yerden (Denetim Merkezi, arama) "Anasayfayı düzenle".
  useUrlCommand(
    "edit",
    "1",
    useCallback(() => setBoardEditing(true), []),
  )
  const label = t(editing ? "header.editBoardDone" : "header.editHome")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={ref}
          type="button"
          onClick={() => setBoardEditing((v) => !v)}
          aria-label={label}
          data-board-edit-toggle=""
          data-tour="home-edit"
          data-editing={editing ? "" : undefined}
          className="fab home-edit-fab"
        >
          <MotionConfig reducedMotion="user">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={editing ? "done" : "edit"}
                initial={{ opacity: 0, scale: 0.6, rotate: -40 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 40 }}
                transition={SWAP}
                className="grid place-items-center"
              >
                <HugeiconsIcon
                  icon={editing ? Tick02Icon : DashboardSquareEditIcon}
                  className="fab-icon"
                  strokeWidth={editing ? 2.2 : 1.8}
                />
              </motion.span>
            </AnimatePresence>
          </MotionConfig>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
