import { useCallback, useState } from "react"
import { compressImageFile } from "@/lib/copilot"
import { OWN, defaultTitle, headChanged, initialHead, titleName, titleOf } from "@/lib/expenseHead"
import { applySlot, initialValues, restoreValues } from "@/lib/promptTemplates"
import {
  FORM_TEMPLATE,
  expenseMessage,
  formErrors,
  newExpenseRow,
  packReceipts,
  requestMessage,
  valuesChanged,
} from "@/lib/requestForm"
import { useLocale } from "@/hooks/useLocale"
import { useExpenseRows } from "./useExpenseRows"

const count = (errors) => Object.keys(errors).length

/**
 * Talep formunun durumu. İzin ve avans tek değer kümesi; masraf kalem kalem (`useExpenseRows`)
 * ve bütün kalemler için tek başlık (`head`: kimin adına · şirket · açıklama). Hatalar ilk
 * gönderme denemesinden sonra görünür (`tried`; masrafta denemede var olan kalemlerde); eksikle
 * gönderilen masrafta ilk hatalı kalem açılır (telefonda kartı) ve hatası tabloda olmayan bir
 * alanda olan her kalemin "Ayrıntı"sı.
 * `owners`: "Kimin adına" listesi (`useExpenseOwners`), `selfName`: formu dolduranın adı
 * (kendi masrafında varsayılan açıklamanın son parçası: "Ekim 26 | TYRO Self Servis | <ad>"; başkası adına
 * girilende o kişinin adı, `titleName`), `columns`: tabloda görünen alanlar,
 * `check(values)`: şablonun bilmediği ek hatalar (izinde kendi izniyle çakışma); şablonunki önce gelir.
 * `initial`: taslaktan ya da sohbetteki karttan dönen form (`{ values, head, rows, receipts }`);
 * "dolu mu" yine boş formla karşılaştırılır. `preset`: `initial` kişinin girdiği değil, açılışta
 * hazır gelen değer (takvimde ya da bağlantıda seçilen gün): "dolu mu" ondan sayılır, dokunulmamış
 * form sormadan kapanır ve taslak olmaz.
 */
export function useRequestForm(
  kind,
  {
    owners = [],
    selfName = "",
    ownCompany = "",
    columns = [],
    check = null,
    initial = null,
    preset = false,
  } = {},
) {
  const { t, locale } = useLocale()
  const key = FORM_TEMPLATE[kind]
  // Başlangıç değerleri saklanır: "dolu mu" bunlarla karşılaştırılır.
  const [start] = useState(() => {
    const blank = initialValues(key)
    const values =
      preset && initial?.values ? { ...blank, ...restoreValues(key, initial.values) } : blank
    return { values, row: newExpenseRow("start").values }
  })
  const [values, setValues] = useState(() =>
    initial?.values ? { ...start.values, ...restoreValues(key, initial.values) } : start.values,
  )
  const [tried, setTried] = useState(false)
  // Gönderme denemesinde var olan kalemler: hatalar onlarda görünür; sonradan eklenen kalem bir
  // sonraki denemeye dek sakin (açılır açılmaz kırmızı olmasın).
  const [triedRows, setTriedRows] = useState(() => new Set())
  // İzinde başlangıç seçilince bitişin takvimi kendiliğinden açılır (`applySlot`).
  const [openDate, setOpenDate] = useState(null)
  const expense = useExpenseRows(initial)
  const { rows } = expense
  const [head, setHeadState] = useState(() =>
    initial?.head ? { ...initialHead(), ...initial.head } : initialHead(ownCompany),
  )
  // Kişinin şirketi (İK kaydı) form açıldıktan sonra gelirse bir kez seçilir: kişi şirkete
  // dokunmadıysa ve form taslaktan ya da karttan dönmüyorsa (orada kişinin seçimi geçerli).
  const [companyFrom, setCompanyFrom] = useState(ownCompany)
  if (ownCompany && ownCompany !== companyFrom && !initial?.head) {
    setCompanyFrom(ownCompany)
    setHeadState((h) => (h.company === OWN ? { ...h, company: ownCompany } : h))
  }
  // Kimliği sabit: başlık şeridi (`memo`) kalemlere yazarken yeniden çizilmez.
  const setHead = useCallback((patch) => setHeadState((h) => ({ ...h, ...patch })), [])
  // Açıklamanın son parçası masrafın sahibi: başkası adına girilirse o kişinin adı.
  const titleDefault = defaultTitle(
    t,
    locale,
    rows[0]?.values.date,
    titleName(head, owners, selfName),
  )

  const setSlot = (name, value) => {
    const next = applySlot(key, values, name, value)
    setValues(next.values)
    if (next.open) setOpenDate(next.open)
  }
  // Takvim iki ucu birlikte yazar: art arda iki `setSlot` birbirinin üstüne yazardı.
  const setRange = (from, to) => setValues((v) => ({ ...v, start: from, end: to }))
  // Öneri birkaç alanı birden doldurur (avansta takvim, son avans; tutar okuması).
  const patch = (next) => setValues((v) => ({ ...v, ...next }))
  const addSlot = (field) => setValues((v) => ({ ...v, [field.name]: field.slot.addDefault(v) }))
  const removeSlot = (name) =>
    setValues((v) => {
      const next = { ...v }
      delete next[name]
      return next
    })

  const isExpense = kind === "expense"
  // Kişinin girdiği bir şey var mı: varsa form dışarı dokunuşla kapanmaz, kapatmak onay ister.
  const dirty = isExpense
    ? headChanged(head, initialHead(ownCompany)) ||
      rows.length > 1 ||
      expense.receipts.length > 0 ||
      rows.some((r) => valuesChanged(start.row, r.values))
    : valuesChanged(start.values, values)
  const errors = isExpense ? null : { ...check?.(values), ...formErrors(key, values) }
  const rowErrors = isExpense ? rows.map((r) => formErrors("expense", r.values)) : null
  const invalid = isExpense ? rowErrors.reduce((n, e) => n + count(e), 0) : count(errors)
  const shownRows = isExpense ? rows.map((r, i) => (triedRows.has(r.id) ? rowErrors[i] : {})) : null
  const shown = isExpense ? shownRows.reduce((n, e) => n + count(e), 0) : invalid

  /**
   * Gönderilecek mesaj ve dosyalar (Promise: fişler önce küçültülür, `packReceipts`); eksik varsa
   * `null` (hatalar görünür olur).
   */
  const build = () => {
    if (invalid) {
      setTried(true)
      if (isExpense) {
        setTriedRows(new Set(rows.map((r) => r.id)))
        const at = rowErrors.findIndex((e) => count(e))
        if (!count(rowErrors[rows.findIndex((r) => r.id === expense.active)] ?? {}))
          expense.activate(rows[at].id)
        // Hatası tablo sütunu olmayan bir alanda olan HER kalemin "Ayrıntı"sı açılır: kapalı
        // panelde alan çizilmez, hata yalnız küçük bir işarette kalırdı.
        rowErrors.forEach((e, i) => {
          if (Object.keys(e).some((k) => !columns.includes(k)))
            expense.showDetails(rows[i].id, true)
        })
      }
      return null
    }
    if (!isExpense)
      return Promise.resolve({ text: requestMessage(t, locale, key, values), files: [] })
    // Fişler masrafın başlığına: tek liste, mesajda bir kez anılır.
    // Fişin döndürmesi (`rotate`) küçültülen görsele uygulanır.
    const list = expense.receipts
    return packReceipts(
      list.map((f) => f.file),
      (n) => t("selfService.form.receiptFile", { n }),
      (file, i) => compressImageFile(file, { rotate: list[i]?.rotate ?? 0 }),
    ).then(({ names, files }) => ({
      text: expenseMessage(t, locale, rows, names, {
        owner: owners.find((o) => o.email === head.owner) ?? null,
        company: head.company,
        title: titleOf(head, titleDefault),
      }),
      files,
    }))
  }

  return {
    key,
    values,
    setSlot,
    setRange,
    patch,
    addSlot,
    removeSlot,
    expense,
    head,
    setHead,
    defaultTitle: titleDefault,
    openDate,
    setOpenDate,
    errors: tried ? errors : null,
    rowErrors: tried ? shownRows : null,
    invalid: tried ? shown : 0,
    dirty,
    build,
    /** Taslağa ve sohbetteki karta yazılan durum (fişler hariç: dosya, ayrıca tutulur). */
    snapshot: () => (isExpense ? { head, rows: rows.map((r) => r.values) } : { values }),
    /** Deneme unutulur (masrafta boş hâlden kalemlere geçince: yeni kalemler sakin başlar). */
    resetTried: () => {
      setTried(false)
      setTriedRows(new Set())
    },
  }
}
