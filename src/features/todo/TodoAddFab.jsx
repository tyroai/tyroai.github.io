import { useState } from "react"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Fab } from "@/components/common/Fab"
import { useLocale } from "@/hooks/useLocale"
import { TodoAddBar } from "./TodoAddBar"
import "./todoMobile.css"

/**
 * TELEFONDA GÖREV EKLEME — ortak yüzen düğme (`Fab`), yalnız artı. Basınca alt çekmecede listenin
 * kendi ekleme alanı (`TodoAddBar`: tarih, yıldız, liste aynı); eklenince çekmece kapanır, yeni
 * satır listede parlar.
 */
export function TodoAddFab({ board, view, today, onAdded, inputRef }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const label = t("todo.add.label")
  return (
    <>
      <Fab
        icon={PlusSignIcon}
        label={label}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        data-tour="todo-add"
      />
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef?.current?.focus()
        }}
      >
        <div className="todo-add-sheet pb-1">
          {/* Anahtar görünüm: çekmece her açılışta görünümün varsayılanlarıyla kurulur. */}
          <TodoAddBar
            key={view}
            board={board}
            view={view}
            today={today}
            inputRef={inputRef}
            compact
            onAdded={(task, replaces) => {
              onAdded(task, replaces)
              if (!replaces) setOpen(false)
            }}
          />
        </div>
      </BottomSheet>
    </>
  )
}
