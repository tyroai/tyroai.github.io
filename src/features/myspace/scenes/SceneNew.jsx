import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Add01Icon from "@hugeicons/core-free-icons/Add01Icon"
import { ActionButton } from "@/components/common/ActionButton"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import "@/lib/i18n/homeLayout"
import { NAME_MAX } from "../lib/scenes"

/**
 * "+ Sahne" — kendi sahneni kurar: ad yazılır, sahne açık olanın kopyası olarak başlar (`from`:
 * açık sahnenin adı). Masaüstünde düğmeden açılan küçük kart, telefonda alt çekmece. `anchor`
 * verilirse kendi düğmesi çizilmez: kart o öğeye tutunur, açılış dışarıdan yönetilir (`open`,
 * `onOpenChange`; seçici biçiminde menüdeki "Yeni sahne").
 */
export function SceneNew({ phone, from, onCreate, anchor, open: outer, onOpenChange }) {
  const { t } = useLocale()
  const [own, setOwn] = useState(false)
  const open = anchor ? Boolean(outer) : own
  const setOpen = anchor ? onOpenChange : setOwn
  const [name, setName] = useState("")
  const ready = Boolean(name.trim())
  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    onCreate(name)
    setName("")
    setOpen(false)
  }
  const title = t("homeLayout.scenes.newTitle")
  const form = (
    <form onSubmit={submit} className="scn-form">
      <Input
        value={name}
        maxLength={NAME_MAX}
        placeholder={t("homeLayout.scenes.namePlaceholder")}
        aria-label={t("homeLayout.scenes.namePlaceholder")}
        autoComplete="off"
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
      />
      <p>{t("homeLayout.scenes.newHint", { scene: from })}</p>
      <ActionButton type="submit" tone="prominent" size="toolbar" disabled={!ready}>
        {t("homeLayout.scenes.create")}
      </ActionButton>
    </form>
  )
  const trigger = (
    <button
      type="button"
      className="scn-new"
      aria-label={t("homeLayout.scenes.newAria")}
      onClick={phone ? () => setOpen(true) : undefined}
    >
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2.2} aria-hidden="true" />
      <span>{t("homeLayout.scenes.new")}</span>
    </button>
  )
  if (phone)
    return (
      <>
        {anchor ?? trigger}
        <BottomSheet open={open} onOpenChange={setOpen} title={title}>
          {form}
        </BottomSheet>
      </>
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {anchor ? (
        <PopoverAnchor asChild>{anchor}</PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      )}
      <PopoverContent align="start" className="w-72 p-3.5">
        <h2 className="scn-form-title">{title}</h2>
        {form}
      </PopoverContent>
    </Popover>
  )
}
