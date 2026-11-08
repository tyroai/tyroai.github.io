import { useRef } from "react"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { number } from "../../../kinds"
import { IconTile } from "../../field/IconTile"
import { ReceiptInputs } from "../../ReceiptPicker"
import { MAX_RECEIPTS } from "../../useExpenseRows"
import { useReceiptTake } from "../../useReceiptTake"
import { refocus } from "../refocus"
import { UndoStrip } from "../table/UndoStrip"
import { receiptsAddId, receiptsId } from "./headReceipts"
import { AddButton, DropOverlay, EmptyBar, TakeButtons } from "./ReceiptAdd"
import { ReceiptRead } from "./ReceiptRead"
import { ReceiptTrack } from "./ReceiptTrack"
import { SkippedNote } from "./SkippedNote"
import { useReceiptPreview } from "./useReceiptPreview"
import { useReceiptRemove } from "./useReceiptRemove"
import { useZoneDrop } from "./useZoneDrop"

const coarse = () => Boolean(window.matchMedia?.("(pointer: coarse)").matches)
const mac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "")
const TIP = "relative -ms-0.5 size-6 pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5"

/**
 * Başlığın fiş şeridi, kalemlerin üstünde tek satır: "Fişler", sayaç ("3 / 20"; dolunca uyarı
 * tonu), ⓘ (fişler masrafın başlığına eklenir; sürükle-bırak, ⌘V), küçük resimler (yalnız
 * sığanlar; öbürleri oklarla, `ReceiptTrack`), sonda "Fiş ekle" (dokunmatikte "Fotoğraf çek" de).
 * Şeridin bütünü bırakma yeri (sürüklerken kesik marka çerçevesi). Fareli ekranda fiş yokken
 * şerit tek bir kesik çizgili düğme: "Fiş ekle · sürükle ya da ⌘V". Kaldırılanın "Geri al"ı (8 sn)
 * ve sınıra takılan eklemenin notu etiketin yanında, tek satır. Dar şeritte (telefon) iki satır:
 * üstte etiket ve ekleme kareleri, altta küçük resimler; fiş yokken iki büyük düğme. Dolunca
 * ekleme kalkar, sınır yazar. `receipts`: akışın fiş nesnesi (`useExpenseFlow().receipts`).
 */
export function ReceiptBar({ idBase, receipts, reading = null, className }) {
  const { t, locale } = useLocale()
  const boxRef = useRef(null)
  const cameraRef = useRef(null)
  const pickRef = useRef(null)
  const touch = coarse()
  const { list } = receipts
  const n = list.length
  const full = n >= MAX_RECEIPTS
  const box = () => boxRef.current
  const { undo, remove, restore } = useReceiptRemove({
    list,
    box,
    onRemove: receipts.remove,
    onRestore: receipts.restore,
  })
  const add = (files) => {
    receipts.add(files)
    // Sınır dolunca ekleme düğmesi kalkar: odak son fişin kaldır düğmesine.
    refocus(() => [...(box()?.querySelectorAll("[data-receipt-remove]") ?? [])].at(-1))
  }
  const take = useReceiptTake(add)
  const preview = useReceiptPreview(list, { onRotate: receipts.rotate })
  const drop = useZoneDrop(add)
  const id = receiptsId(idBase)
  const max = number(MAX_RECEIPTS, locale)
  const keys = mac() ? "⌘V" : "Ctrl+V"
  const tip = t("selfService.expense.receipts.tip", { keys })
  // `data-receipt-add`: kaldırınca odağın son durağı; özetin "Fiş ekle"si buna basar.
  const addProps = { id: receiptsAddId(idBase), "data-receipt-add": "" }
  const pick = () => pickRef.current?.click()
  const camera = () => cameraRef.current?.click()
  const empty = !n && !touch
  const thumb = (f) => ({
    read: reading?.status[f.id]?.status ?? null,
    tab: preview.inTab(f),
    broken: Boolean(f.url) && preview.inTab(f),
    onPreview: preview.open,
    onBroken: preview.markBroken,
    onRemove: remove,
  })

  return (
    <div
      id={id}
      ref={boxRef}
      role="group"
      data-tour="req-receipts"
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-hint`}
      data-drop-zone=""
      {...drop.handlers}
      className={cn(
        "@container/rcpt relative min-w-0 rounded-[1rem] transition-colors",
        empty
          ? "border-[1.5px] border-dashed border-foreground/[0.16] bg-foreground/[0.015] hover:border-brand/40 dark:border-white/[0.18]"
          : "border border-black/[0.06] bg-foreground/[0.02] dark:border-white/[0.08] dark:bg-white/[0.025]",
        className,
      )}
    >
      <span id={`${id}-hint`} className="sr-only">
        {tip}
      </span>
      {empty ? (
        <EmptyBar add={addProps} keys={keys} onPick={pick}>
          <span id={`${id}-label`} className="sr-only">
            {t("selfService.expense.receipts.title")}
          </span>
          {/* Son fiş kaldırılınca da "Geri al" yerinde kalsın. */}
          <UndoStrip
            undo={undo}
            onUndo={restore}
            text={t("selfService.expense.receiptRemoved")}
            keys={false}
          />
          <InfoTip text={tip} className={TIP} />
        </EmptyBar>
      ) : (
        // Kap sorgusu kabın kendisini değil içini biçimler: boşluk bu ızgarada.
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-3 py-2 @[30rem]/rcpt:grid-cols-[auto_minmax(0,1fr)_auto] @[30rem]/rcpt:py-1">
          <div className="col-start-1 row-start-1 flex min-h-8 min-w-0 items-center gap-2">
            <IconTile icon={Invoice01Icon} size="sm" state={n ? "done" : null} className="me-0.5" />
            <span id={`${id}-label`} className="shrink-0 text-[0.8125rem] font-semibold">
              {t("selfService.expense.receipts.title")}
            </span>
            {n > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 shrink-0 items-center rounded-full px-1.5 text-[0.75rem] font-medium tabular-nums",
                  full
                    ? "bg-warning/12 text-warning-ink"
                    : "bg-foreground/[0.06] text-foreground/75",
                )}
              >
                {t("selfService.expense.receipts.count", { n: number(n, locale), max })}
              </span>
            )}
            <InfoTip text={tip} className={TIP} />
            <SkippedNote n={receipts.skipped} />
            <UndoStrip
              undo={undo}
              onUndo={restore}
              text={t("selfService.expense.receiptRemoved")}
              keys={false}
            />
          </div>
          {n > 0 && (
            <ReceiptTrack
              list={list}
              thumb={thumb}
              className="col-span-2 row-start-2 @[30rem]/rcpt:col-span-1 @[30rem]/rcpt:col-start-2 @[30rem]/rcpt:row-start-1"
            />
          )}
          <div
            className={cn(
              "flex min-w-0 items-center justify-end gap-2 @[30rem]/rcpt:col-start-3 @[30rem]/rcpt:row-start-1",
              touch && !n
                ? "col-span-2 row-start-2 @[30rem]/rcpt:col-span-1"
                : "col-start-2 row-start-1",
            )}
          >
            {reading && n > 0 && <ReceiptRead reading={reading} list={list} />}
            {full ? (
              // Dar şeritte sığmayanın notu varsa sınır yazılmaz: not etiketin yanında sığsın.
              <span
                className={cn(
                  "whitespace-nowrap px-1 text-[0.75rem] text-muted-foreground",
                  receipts.skipped > 0 && "hidden @[30rem]/rcpt:inline",
                )}
              >
                {t("selfService.form.receiptFull", { n: max })}
              </span>
            ) : touch ? (
              <TakeButtons
                add={addProps}
                big={!n}
                onCamera={camera}
                onPick={pick}
                className={cn(!n && "w-full @[30rem]/rcpt:w-auto")}
              />
            ) : (
              <AddButton add={addProps} onPick={pick} />
            )}
          </div>
        </div>
      )}
      <ReceiptInputs cameraRef={cameraRef} pickRef={pickRef} onChange={take} />
      {preview.viewer}
      {drop.over && (
        <DropOverlay
          full={full}
          text={
            full
              ? t("selfService.form.receiptFull", { n: max })
              : t("selfService.expense.receipts.dropNow")
          }
        />
      )}
    </div>
  )
}
