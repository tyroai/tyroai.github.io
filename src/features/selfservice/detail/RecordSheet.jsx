import "@/lib/i18n/selfService"
import { useEffect, useRef, useState } from "react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { RecordPaper } from "@/components/record-window/RecordFrame"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { onOpenChat } from "@/lib/chatBus"
import { recordKey } from "@/lib/selfServiceModel"
import { cn } from "@/lib/utils"
import { describe } from "../recordText"
import { RecordContent, RecordWindow } from "./window/RecordWindow"
import { RecordActions } from "./window/WindowBar"

/**
 * Kaydın ayrıntısı: masaüstünde ortada pencere (`window/RecordWindow`), telefonda alttan çekmece —
 * içerik ikisinde de aynı (`RecordContent`): başlık, ilerleme kartı, ayrıntılar, masrafta kalemler.
 * Gövde kayda göre yeniden kurulur (kalemlerin görünümü bir kayıttan ötekine taşınmaz). Sohbeti açan
 * her istek ("TYRO'ya sor") bölmeyi kapatır: rıhtım modal bölmenin arkasında açılmasın; odak
 * satıra dönmez, sohbete bırakılır (`MemberSheet`le aynı kural). Öteki kapanışta odak açan
 * satıra döner (`useReturnFocus`; telefonda `BottomSheet` kendisi yapar). Telefonda çekmece tam
 * boy, adı kaydın türü (pencerenin şeridi gibi); şeridin eylemleri (`RecordActions`) başparmağın
 * altında, kaymayan alt şeritte; kâğıt çerçevesiz (çekmece zaten kenar çiziyor).
 */
export function RecordSheet({ record, facet, person, onOpenChange, onAsk }) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const open = Boolean(record)
  const key = record ? recordKey(record) : "none"
  const asked = useRef(false)
  const back = useReturnFocus()
  // Kayıt masaüstünde ortada açılır: izin ve avans dar ve dikey, masraf geniş ve iki sütun
  // (`window/recordWindow.css`).
  // Kapanırken kayıt boşaldığında da aynı en kalsın diye tür son açılan kayıttan hatırlanır.
  const [lastKind, setLastKind] = useState(null)
  if (record && record.kind !== lastKind) setLastKind(record.kind)
  const wide = lastKind === "expense"
  useEffect(() => {
    if (!open) return undefined
    return onOpenChat(() => {
      asked.current = true
      onOpenChange(false)
    })
  }, [open, onOpenChange])
  // Sohbet rıhtımı pencerede Escape dinliyor: bölmeyi kapatan Escape rıhtımı kapatmasın.
  const onEscapeKeyDown = (e) => e.stopPropagation()
  const onCloseAutoFocus = (event) => {
    if (asked.current) event.preventDefault()
    asked.current = false
  }
  if (mobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={onEscapeKeyDown}
        className="max-h-[92dvh] data-[side=bottom]:h-[92dvh]"
        title={record ? t(`selfService.detail.kind.${record.kind}`) : ""}
        description={record ? describe(record, t, locale).title : undefined}
        footer={
          record && (
            <div className="rw-foot">
              <RecordActions key={key} record={record} person={person} onAsk={onAsk} />
            </div>
          )
        }
      >
        {record && (
          <RecordPaper className="rw-sheet--flat">
            <RecordContent key={key} record={record} facet={facet} person={person} />
          </RecordPaper>
        )}
      </BottomSheet>
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={back.onOpenAutoFocus}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus(e)
          back.onCloseAutoFocus(e)
        }}
        onEscapeKeyDown={onEscapeKeyDown}
        data-layout={wide ? "wide" : "narrow"}
        className={cn(
          "flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-h-[88dvh] sm:pb-0",
          "rw-window",
        )}
      >
        <DialogTitle className="sr-only">
          {record ? describe(record, t, locale).title : ""}
        </DialogTitle>
        <DialogDescription className="sr-only">{t("selfService.detail.aria")}</DialogDescription>
        {record && (
          <RecordWindow
            facet={facet}
            key={key}
            record={record}
            person={person}
            onAsk={onAsk}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Pencere ve çekmece olmadan aynı içerik — Takvim'in sağ panelinde (izin çipine basınca): kâğıt
 * çerçevesiz, altta şeridin eylemleri. Kap, başlık ve kapatma çağıranın; sınıflar onun düzeni.
 */
export function RecordPane({ record, person, onAsk, bodyClass, footClass }) {
  const key = recordKey(record)
  return (
    <>
      {/* Kayan gövde klavyeyle de kaysın: kayıtta odaklanacak öğe olmayabilir (axe). */}
      <div className={bodyClass} tabIndex={0}>
        <RecordPaper className="rw-sheet--flat">
          <RecordContent key={key} record={record} person={person} />
        </RecordPaper>
      </div>
      <div className={cn("rw-foot", footClass)}>
        <RecordActions key={key} record={record} person={person} onAsk={onAsk} />
      </div>
    </>
  )
}
