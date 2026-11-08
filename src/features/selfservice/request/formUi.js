import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"

/** Talep formlarının ortak görünümü: alan kutusu, etiket, hata. */
export const CONTROL =
  "req-ctl flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3 text-start text-[0.875rem] text-foreground shadow-xs transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 aria-invalid:border-destructive/70 aria-invalid:ring-2 aria-invalid:ring-destructive/15 pointer-coarse:h-11"

export const LABEL = "mb-2 flex items-center gap-1 text-[0.8125rem] font-medium text-foreground"

export const ERROR = "mt-1.5 text-[0.75rem] font-medium leading-snug text-danger-ink"

/** Sözlükteki alan ve seçenek adları cümle içi küçük harfle yazılı ("yıllık izin"); formda baş harf büyük. */
export const capFirst = (s, locale) =>
  s ? String(s).charAt(0).toLocaleUpperCase(locale) + String(s).slice(1) : s

/** Masraf tablosu sütununun adı: şablon alanının etiketi. */
export const columnLabel = (t, locale, id) => capFirst(t(`myspace.slot.${id}`), locale)

// Kişi sayısı tutar gibi denetlenir ama hatası para birimini anmaz.
const PEOPLE = PROMPT_TEMPLATES.expense.slots.people

/** Alan hatasının metni (`formErrors` türü → sözlük). */
export function errorText(t, slot, error) {
  if (!error) return null
  if (error === "order") return t("selfService.form.err.order")
  if (error === "amount")
    return t(slot === PEOPLE ? "selfService.form.err.people" : "selfService.form.err.amount")
  if (error === "overlap") return t("selfService.form.err.overlap")
  if (slot.type === "date") return t("selfService.form.err.date")
  if (slot.type === "choice") return t("selfService.form.err.choice")
  if (slot.type === "amount") return t("selfService.form.err.amountEmpty")
  return t("selfService.form.err.text")
}

/** Geniş alan (iki sütunu kaplar): açıklama ve kod · unvan gösteren şirket seçicisi. */
export const isWide = (field) => Boolean(field.slot.describe) || field.name === "note"

/** Odak bir sonraki çizimde (yeni açılan alan, geri gelen "+ alan" çipi henüz yok). */
export function focusSoon(selector) {
  requestAnimationFrame(() => document.querySelector(selector)?.focus())
}

/** Alanın odaklanacak öğesi: kutu ya da seçicinin tetiği. */
export const fieldSelector = (idBase, name) => `#${CSS.escape(`${idBase}-${name}`)}`

/** Yeni ya da kopyalanan masraf kalemi görünür olur, odak kategorisine geçer (tablo düzeni). */
export function focusExpenseRow(idBase, id) {
  if (!id) return
  requestAnimationFrame(() => {
    const el = document.getElementById(`${idBase}-${id}`)
    el?.scrollIntoView({ block: "nearest" })
    el?.querySelector("[data-cell='category'] button")?.focus()
  })
}

// Sohbet rıhtımı Escape'i pencerede dinliyor: formu kapatan Escape rıhtımı kapatmasın. Açık bir
// seçici varsa Escape yalnız onu kapatır: Radix pencereden önce (yakalama evresinde) duyuyor,
// pencere kapanmaz ve olay seçiciye ulaşır (seçici yayılmayı kendisi durdurur).
export const keepEscape = (e) => {
  if (e.target?.closest?.("[data-morph-open]")) e.preventDefault()
  else e.stopPropagation()
}
