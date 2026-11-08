import { useMemo } from "react"
import { SheetSelect } from "@/components/common/SheetSelect"
import { MorphSelect } from "@/components/ui/morph-select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { optionLabel } from "@/lib/promptTemplates"
import { categoryGroup, groupOptions } from "@/features/selfservice/lib/requestFormItems"
import { capFirst } from "./formUi"

/** Para biriminin dar simgesi ("₺", "$"); bulunamazsa boş. */
function symbolOf(currency, locale) {
  try {
    const parts = getNumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0)
    const sym = parts.find((p) => p.type === "currency")?.value
    return sym && sym !== currency ? sym : ""
  } catch {
    return ""
  }
}

// "Son kullandıkların" kopyalarının değeri: listede tekil kalsın (seçilince asıl değer yazılır).
const RECENT = "recent\u0001"

/**
 * Şablonun seçenek alanı için öğeler: etiket sözlükten (baş harf büyük); `describe`'lı alanda
 * (şirket) kod · unvan; para biriminde simge; masraf kategorisinde yurtiçi/yurtdışı grupları,
 * kişinin geçmişi varsa en üstte "Son kullandıkların" (`recent`; aramada gizli, sonuçlar iki kez
 * görünmesin).
 */
function slotItems(t, locale, name, slot, recent) {
  const item = (o) => {
    const label = capFirst(optionLabel(t, slot, o), locale)
    const sub = slot.describe?.(o)
    if (sub) return { value: o, label: `${label} · ${sub}` }
    if (name === "currency") return { value: o, label, meta: symbolOf(o, locale) }
    return { value: o, label }
  }
  const groups = name === "category" ? groupOptions(slot.options, categoryGroup) : null
  if (!groups) return slot.options.map(item)
  const list = groups.map((g) => ({
    label: t(`selfService.form.group.${g.key}`),
    options: g.options.map(item),
  }))
  const known = recent?.filter((o) => slot.options.includes(o)) ?? []
  if (!known.length) return list
  const copies = known.map((o) => ({ ...item(o), value: RECENT + o, aliasOf: o }))
  return [
    { label: t("selfService.form.group.recent"), options: copies, hideOnSearch: true },
    ...list,
  ]
}

/**
 * Şablon seçenek alanının seçicisi (Arc morph-select). Uzun listede (`slot.search`) arama;
 * telefonda aramalı uzun liste yerinde açılmaz, alttan tam boy çekmecede açılır (`SheetSelect`:
 * yerinde liste form gövdesinin kalan yerine sığıyor, klavyede iki seçenek görünüyordu).
 * `error` varsa kutu kırmızı ve hata metnine bağlı. `id`: tetiğin kimliği (etiket ve odak).
 * `placeholder`: seçim yokken görünen (yoksa "Seç"; ızgarada "Kategori seç").
 * `recent`: masraf kategorisinde kişinin en çok kullandıkları (`CategorySelect` verir).
 */
export function SlotSelect({
  id,
  labelId,
  label,
  name,
  slot,
  value,
  onPick,
  error,
  errorId,
  panelWidth,
  align,
  placeholder,
  recent,
  className,
}) {
  const { t, locale } = useLocale()
  const mobile = useIsMobile()
  const items = useMemo(
    () => slotItems(t, locale, name, slot, recent),
    [t, locale, name, slot, recent],
  )
  const strings = useMemo(
    () => ({
      clear: t("selfService.form.searchClear"),
      close: t("selfService.form.listClose"),
      empty: (q) => t("selfService.form.noMatch", { q }),
      count: (n) => t("selfService.form.matchCount", { n }),
    }),
    [t],
  )
  const common = {
    id,
    label,
    labelledBy: labelId,
    items,
    value: value ?? null,
    onValueChange: onPick,
    placeholder: placeholder ?? t("selfService.form.choose"),
    searchable: Boolean(slot.search),
    searchPlaceholder: t("myspace.template.search"),
    invalid: Boolean(error),
    describedBy: error ? errorId : undefined,
    strings,
    className,
  }
  if (mobile && slot.search) return <SheetSelect {...common} />
  return (
    <MorphSelect
      {...common}
      // Aramalı uzun listede (masraf kategorisi, şirket) adlar kesilmesin, çok seçenek görünsün.
      panelWidth={panelWidth ?? (slot.search ? 400 : 0)}
      maxListHeight={slot.search ? 320 : 248}
      align={align}
    />
  )
}
